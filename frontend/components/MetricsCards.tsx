import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function MetricsCards({ total, qualified, highPotential }: { total: number; qualified: number; highPotential: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-600">Total Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-600">Qualified</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{qualified}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-600">High Potential</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{highPotential}</div>
        </CardContent>
      </Card>
    </div>
  )
}
