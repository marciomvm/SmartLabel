'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { deleteBulkBatches, updateBatchStatus } from '@/actions/batch'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, CheckSquare, Square, Loader2, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

interface BatchesTableProps {
    batches: any[]
    totalCount: number
    currentPage: number
    limit: number
}

export function BatchesTable({ batches = [], totalCount = 0, currentPage = 1, limit = 50 }: BatchesTableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isPending, startTransition] = useTransition()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const totalPages = Math.ceil(totalCount / limit)
    const startItem = (currentPage - 1) * limit + 1
    const endItem = Math.min(currentPage * limit, totalCount)

    // Handle limit change
    const handleLimitChange = (newLimit: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('limit', newLimit)
        params.set('page', '1') // Reset to first page
        router.push(`/batches?${params.toString()}`)
    }

    // Handle page change
    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())
        router.push(`/batches?${params.toString()}`)
    }

    // Toggle single row selection
    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    // Toggle all visible rows
    const toggleSelectAll = () => {
        if (selectedIds.size === batches.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(batches.map(b => b.id)))
        }
    }

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteBulkBatches(Array.from(selectedIds))
                setSelectedIds(new Set()) // Clear selection
                setIsDeleteDialogOpen(false)
            } catch (err: any) {
                alert(`Error: ${err.message}`)
            }
        })
    }

    const selectedCount = selectedIds.size
    const isAllSelected = batches.length > 0 && selectedCount === batches.length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Inventory</h1>
                    {selectedCount > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                                {selectedCount} Selected
                            </Badge>
                            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="gap-2">
                                        <Trash2 className="h-4 w-4" />
                                        Delete Selected
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="glass border-red-200">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-red-600">Delete {selectedCount} batches?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. These batches will be permanently removed.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handleDelete()
                                            }}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                            disabled={isPending}
                                        >
                                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Delete All'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>
                <Button asChild>
                    <Link href="/batches/create">
                        <Plus className="mr-2 h-4 w-4" /> New Batch
                    </Link>
                </Button>
            </div>

            {/* Pagination Controls - Top */}
            <div className="flex items-center justify-between bg-card rounded-lg p-3 border">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <Select value={limit.toString()} onValueChange={handleLimitChange}>
                        <SelectTrigger className="w-[80px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">per page</span>
                </div>
                <div className="text-sm text-muted-foreground">
                    {totalCount > 0 ? (
                        <>Showing <span className="font-medium text-foreground">{startItem}-{endItem}</span> of <span className="font-medium text-foreground">{totalCount}</span> items</>
                    ) : (
                        'No items'
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px] text-center">
                                <button
                                    onClick={toggleSelectAll}
                                    className="hover:text-primary transition-colors"
                                    title="Select All"
                                >
                                    {isAllSelected ? (
                                        <CheckSquare className="h-5 w-5 text-primary" />
                                    ) : (
                                        <Square className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </button>
                            </TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden md:table-cell">Parent</TableHead>
                            <TableHead className="hidden md:table-cell">Created</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {batches.map((batch) => {
                            const isSelected = selectedIds.has(batch.id)
                            return (
                                <TableRow key={batch.id} className={isSelected ? 'bg-muted/50' : ''}>
                                    <TableCell className="text-center">
                                        <button
                                            onClick={() => toggleSelection(batch.id)}
                                            className="hover:text-primary transition-colors flex justify-center w-full"
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="h-5 w-5 text-primary" />
                                            ) : (
                                                <Square className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </button>
                                    </TableCell>
                                    <TableCell className="font-mono font-medium">
                                        <Link href={`/batches/${batch.id}`} className="hover:underline">
                                            {batch.readable_id}
                                        </Link>
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
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        {batch.status === 'READY' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    startTransition(async () => {
                                                        await updateBatchStatus(batch.id, 'SOLD')
                                                    })
                                                }}
                                                className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50"
                                                title="Mark as Sold"
                                                disabled={isPending}
                                            >
                                                <DollarSign className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/batches/${batch.id}`}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {(!batches || batches.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No batches found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls - Bottom */}
            {totalCount > 0 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                            pageNum = i + 1
                        } else if (currentPage <= 3) {
                            pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                        } else {
                            pageNum = currentPage - 2 + i
                        }
                        return (
                            <Button
                                key={pageNum}
                                variant={pageNum === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(pageNum)}
                                className="w-9"
                            >
                                {pageNum}
                            </Button>
                        )
                    })}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}
