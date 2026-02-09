import { getSoldBatches, getSoldCountLast30Days } from '@/actions/batch'
import { SalesTable } from '@/components/sales/sales-table'

export const dynamic = 'force-dynamic'

interface SearchParams {
    period?: string
}

const periodDays: Record<string, number> = {
    '30d': 30,
    '3m': 90,
    '6m': 180,
    '1y': 365,
}

export default async function SalesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const params = await searchParams
    const period = params.period || '30d'
    const days = periodDays[period] || 30

    const batches = await getSoldBatches(days)
    const totalRevenue = batches.filter(b => b.type === 'SUBSTRATE' || b.type === 'BULK').length * 20

    return (
        <SalesTable
            batches={batches}
            totalRevenue={totalRevenue}
            currentPeriod={period}
        />
    )
}
