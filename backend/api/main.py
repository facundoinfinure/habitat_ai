from __future__ import annotations

import os
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not OPENAI_API_KEY or not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    missing = [
        name
        for name, value in (
            ("OPENAI_API_KEY", OPENAI_API_KEY),
            ("SUPABASE_URL", SUPABASE_URL),
            ("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
        )
        if not value
    ]
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

client = OpenAI(api_key=OPENAI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = FastAPI(title="Habitat AI RAG Service", version="0.1.0")


class RAGQuery(BaseModel):
    proyecto_id: str = Field(..., description="UUID of the project")
    pregunta: str = Field(..., description="User question text")


class RAGResponse(BaseModel):
    respuesta: str
    source_documents: List[str]


def get_embedding(text: str) -> List[float]:
    # Model per spec; note that ada-002 is legacy in some accounts
    embedding = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002",
    )
    return embedding.data[0].embedding  # type: ignore[return-value]


def search_similar_documents(proyecto_id: str, query_embedding: List[float], k: int = 5) -> List[dict]:
    # Uses a SQL function added in schema: match_vectores_rag
    response = supabase.rpc(
        "match_vectores_rag",
        {
            "proyecto": proyecto_id,
            "query_embedding": query_embedding,
            "match_count": k,
        },
    ).execute()

    if response.error:
        raise HTTPException(status_code=500, detail=str(response.error))

    # Each row should contain id, texto_original, similarity
    return response.data or []


def build_prompt(context_docs: List[str], question: str) -> str:
    context_block = "\n\n".join([f"[DOC {i+1}]\n{doc}" for i, doc in enumerate(context_docs)])
    system = (
        "Eres Habitat AI, un asistente experto en proyectos inmobiliarios. "
        "Responde de forma breve, precisa y útil basándote SOLO en el contexto. "
        "Si no hay información suficiente, responde que no tienes datos y sugiere hablar con un asesor."
    )
    prompt = (
        f"{system}\n\nCONTEXT:\n{context_block}\n\nPREGUNTA:\n{question}\n\n"
        "Instrucciones: Si la respuesta no está en el contexto, di claramente que no está disponible."
    )
    return prompt


@app.post("/api/query", response_model=RAGResponse)
async def query_rag(payload: RAGQuery) -> RAGResponse:
    try:
        query_vec = get_embedding(payload.pregunta)
        rows = search_similar_documents(payload.proyecto_id, query_vec, k=5)
        source_docs = [row.get("texto_original", "") for row in rows]

        prompt = build_prompt(source_docs, payload.pregunta)
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Respondes en español."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=400,
        )
        answer = completion.choices[0].message.content or ""

        return RAGResponse(respuesta=answer, source_documents=source_docs)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc))
