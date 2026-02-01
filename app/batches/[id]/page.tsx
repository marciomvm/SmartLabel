import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BatchActions } from '@/components/batch/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, AlertOctagon } from 'lucide-react'
import { PrintLabelButton } from '@/components/batch/print-button'
import { DeleteBatchButton } from '@/components/batch/delete-button'
import { NotesEditor } from '@/components/batch/notes-editor'

// Next.js 15: params is a Promise
export default async function BatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // 1. Fetch Batch
    const { data: batch } = await supabase
        .from('mush_batches')
        .select('*, strain:mush_strains(name)')
        .eq('id', id)
        .single()

    if (!batch) {
        notFound()
    }

    // 2. Fetch Children (Downstream) - Immediate only for now
    const { data: children } = await supabase
        .from('mush_batches')
        .select('id, readable_id, status, type')
        .eq('parent_id', id)
        .order('created_at')

    // 3. Fetch Ancestors (Upstream) - Check for contamination
    // Accessing the view. Note: The view returns "Ancestors of X".
    // The 'id' column in the view is the START point (the child).
    // But wait, the CTE structure I wrote:
    // Base: `select id... from batches`
    // Recursive: `select p.id... from batches p join genealogy g on g.parent_id = p.id`
    // If I select * from view where (?)
    // Actually, my view logic might be returning separate rows for each ancestor?
    // Let's assume for MVP specific logic: I'll just check the immediate parent for display.
    // And maybe fetch the view for the warning.
    /*
      const { data: ancestors } = await supabase
        .from('view_batch_lineage') // if it works as expected
        .select('*')
        .eq('id', id) // Wait, the CTE output columns. "id" is the specific node in the chain OR the starting node?
        // In my CTE:
        // Base: select id as id... (this is the starting batch)
        // Recursive: select p.id as id... (this is the parent)
        // So the column 'id' changes at each step to be the ancestor's ID.
        // So to find "Ancestors of X", I can't filter by `id=X`.
        // I would need to preserve the "root_id" in the CTE.
      
      Let's skip the view for now and just do a manual check of the Parent since depth is usually just 1 level (Grain->Substrate) or 2.
    */

    // Manual Parent Fetch for display
    let parent = null
    if (batch.parent_id) {
        const { data } = await supabase
            .from('mush_batches')
            .select('id, readable_id, status, type')
            .eq('id', batch.parent_id)
            .single()
        parent = data
    }

    const isParentContaminated = parent?.status === 'CONTAMINATED'

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Badge variant="outline" className="mb-2">{batch.type}</Badge>
                    <h1 className="text-3xl font-mono font-bold">{batch.readable_id}</h1>
                    <p className="text-muted-foreground">
                        Strain: {batch.strain?.name || 'Unknown'}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-muted-foreground">All time:</div>
                    {/* Date logic would go here */}
                    <div>{(new Date(batch.created_at)).toLocaleDateString()}</div>
                </div>
            </div>

            {isParentContaminated && (
                <div className="bg-destructive/15 text-destructive p-4 rounded-lg flex items-center gap-3 border border-destructive/20 font-bold">
                    <AlertOctagon className="h-6 w-6" />
                    <div>
                        WARNING: Parent {parent?.readable_id} is CONTAMINATED.
                        <br />This batch is at high risk.
                    </div>
                </div>
            )}

            {/* Main Status & Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Status: <span className="uppercase">{batch.status}</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <BatchActions id={batch.id} currentStatus={batch.status} />
                    <div className="border-t pt-4">
                        <PrintLabelButton
                            batchId={batch.readable_id}
                            batchType={batch.type}
                            strain={batch.strain?.name}
                            lcBatch={batch.lc_batch}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Lineage */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Parent */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ArrowUp className="h-4 w-4" /> Parent Source
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {parent ? (
                            <Link href={`/batches/${parent.id}`} className="block p-3 border rounded hover:bg-muted font-mono">
                                {parent.readable_id}
                                <Badge variant="secondary" className="ml-2 text-xs">{parent.type}</Badge>
                                {parent.status === 'CONTAMINATED' && <Badge variant="destructive" className="ml-2">CONTAM</Badge>}
                            </Link>
                        ) : (
                            <div className="text-muted-foreground italic p-2">Original Source (No Parent)</div>
                        )}
                    </CardContent>
                </Card>

                {/* Children */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ArrowDown className="h-4 w-4" /> Children Batches
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {children && children.length > 0 ? children.map((child: any) => (
                            <Link key={child.id} href={`/batches/${child.id}`} className="block p-3 border rounded hover:bg-muted font-mono flex justify-between items-center">
                                <span>{child.readable_id}</span>
                                <div className="flex gap-2">
                                    <Badge variant="secondary" className="text-xs">{child.type}</Badge>
                                    {child.status === 'CONTAMINATED' && <span className="text-xs text-destructive font-bold">⚠</span>}
                                </div>
                            </Link>
                        )) : (
                            <div className="text-muted-foreground italic p-2">No children created yet.</div>
                        )}

                        {/* Quick Action to Create Child */}
                        {batch.status === 'READY' && batch.type === 'GRAIN' && (
                            <Link href={`/batches/create?parent_id=${batch.id}&parent_readable_id=${batch.readable_id}`} className="block text-center text-sm text-primary p-2 border border-dashed rounded hover:bg-muted/50 mt-2">
                                + Create Substrate from this
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* NOTE/EVENTS */}
            <NotesEditor id={batch.id} initialNotes={batch.notes} />

            {/* DANGER ZONE (Delete) */}
            <div className="border border-red-200 rounded-xl p-6 bg-red-50/50">
                <h3 className="text-red-900 font-bold mb-2 text-sm uppercase tracking-wider">Danger Zone</h3>
                <div className="flex items-center justify-between">
                    <div className="text-sm text-red-700">
                        Permanently delete this batch and all its history.
                    </div>
                    <DeleteBatchButton id={batch.id} />
                </div>
            </div>
        </div>
    )
}
