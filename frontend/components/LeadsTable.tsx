import { Table, TBody, THead, TH, TR, TD } from './ui/table'
import { formatDate } from '../lib/utils'

type Lead = {
  id: string
  phone_number: string | null
  status: string
  scoring_financiero: number | null
  tags: string[]
  last_interaction_at: string | null
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <Table>
        <THead>
          <TR>
            <TH>Phone</TH>
            <TH>Status</TH>
            <TH>Score</TH>
            <TH>Tags</TH>
            <TH>Last Interaction</TH>
          </TR>
        </THead>
        <TBody>
          {leads.map((l) => (
            <TR key={l.id} className="odd:bg-gray-50/40">
              <TD>{l.phone_number ?? '—'}</TD>
              <TD>{l.status}</TD>
              <TD>{l.scoring_financiero ?? '—'}</TD>
              <TD>{l.tags?.length ? l.tags.join(', ') : '—'}</TD>
              <TD>{formatDate(l.last_interaction_at)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  )
}
