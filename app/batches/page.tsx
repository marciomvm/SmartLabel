import { supabase } from '@/lib/supabase'
import { BatchesTable } from '@/components/batch/batches-table'

export const dynamic = 'force-dynamic'

export default async function BatchesPage() {
    const { data: batches, error } = await supabase
        .from('mush_batches')
        .select('*, parent:mush_batches!parent_id(readable_id)')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error("Batches Fetch Error:", error)
    }

    return <BatchesTable batches={batches || []} />
}
