import { getBatchesPaginated } from '@/actions/batch'
import { BatchesTable } from '@/components/batch/batches-table'

export const dynamic = 'force-dynamic'

interface SearchParams {
    page?: string
    limit?: string
    search?: string
}

export default async function BatchesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const params = await searchParams
    const page = parseInt(params.page || '1', 10)
    const limit = parseInt(params.limit || '50', 10)
    const search = params.search || ''

    // Validate limit to allowed values
    const validLimits = [30, 50, 100]
    const validatedLimit = validLimits.includes(limit) ? limit : 50

    const { batches, totalCount } = await getBatchesPaginated(page, validatedLimit, search)

    return (
        <BatchesTable
            batches={batches}
            totalCount={totalCount}
            currentPage={page}
            limit={validatedLimit}
            search={search}
        />
    )
}
