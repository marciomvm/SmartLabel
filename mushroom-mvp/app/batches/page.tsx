import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Helper to colorize status
function StatusBadge({ status }: { status: string }) {
    const styles = {
        INCUBATING: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
        READY: 'bg-green-100 text-green-800 hover:bg-green-100',
        SOLD: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        CONTAMINATED: 'bg-red-100 text-red-800 hover:bg-red-100',
    }
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
            {status}
        </span>
    )
}

export default async function BatchesPage() {
    const { data: batches, error } = await supabase
        .from('mush_batches')
        .select('*, parent:mush_batches!parent_id(readable_id)')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error("Batches Fetch Error:", error)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Inventory</h1>
                <Button asChild>
                    <Link href="/batches/create">
                        <Plus className="mr-2 h-4 w-4" /> New Batch
                    </Link>
                </Button>
            </div>

            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden md:table-cell">Parent</TableHead>
                            <TableHead className="hidden md:table-cell">Created</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {batches?.map((batch) => (
                            <TableRow key={batch.id}>
                                <TableCell className="font-mono font-medium">
                                    {batch.readable_id}
                                </TableCell>
                                <TableCell>{batch.type}</TableCell>
                                <TableCell>
                                    <StatusBadge status={batch.status} />
                                </TableCell>
                                <TableCell className="hidden md:table-cell font-mono text-muted-foreground">
                                    {batch.parent?.readable_id || '-'}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                    {new Date(batch.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/batches/${batch.id}`}>View</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!batches || batches.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {error ? "Failed to load batches (Check DB connection)" : "No batches found. Start by scanning or creating one."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
