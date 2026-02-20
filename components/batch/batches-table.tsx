'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { deleteBulkBatches, updateBatchStatus, markBulkAsSold } from '@/actions/batch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, CheckSquare, Square, Loader2, DollarSign, ChevronLeft, ChevronRight, ArrowRight, Search, X } from 'lucide-react'
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

import { BatchType } from '@/types'

interface BatchesTableProps {
    batches: any[]
    totalCount: number
    currentPage: number
    limit: number
    search?: string
    type?: BatchType | 'ALL'
}

export function BatchesTable({ batches = [], totalCount = 0, currentPage = 1, limit = 50, search = '', type = 'ALL' }: BatchesTableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isPending, startTransition] = useTransition()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isSoldDialogOpen, setIsSoldDialogOpen] = useState(false)
    const [isRangeDialogOpen, setIsRangeDialogOpen] = useState(false)
    const [rangeStart, setRangeStart] = useState('')
    const [rangeEnd, setRangeEnd] = useState('')
    const [searchInput, setSearchInput] = useState(search)

    const totalPages = Math.ceil(totalCount / limit)
    const startItem = (currentPage - 1) * limit + 1
    const endItem = Math.min(currentPage * limit, totalCount)

    // Handle real-time auto search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchInput !== (search || '')) {
                const params = new URLSearchParams(searchParams.toString())
                if (searchInput) {
                    params.set('search', searchInput)
                } else {
                    params.delete('search')
                }
                params.set('page', '1')
                router.push(`/batches?${params.toString()}`)
            }
        }, 400) // 400ms debounce

        return () => clearTimeout(timeoutId)
    }, [searchInput, search, router, searchParams])

    // Manual Handle search (keep for fallback/button)
    const handleSearch = () => {
        const params = new URLSearchParams(searchParams.toString())
        if (searchInput) {
            params.set('search', searchInput.toUpperCase())
        } else {
            params.delete('search')
        }
        params.set('page', '1')
        router.push(`/batches?${params.toString()}`)
    }

    // Clear search
    const clearSearch = () => {
        setSearchInput('')
        const params = new URLSearchParams(searchParams.toString())
        params.delete('search')
        params.set('page', '1')
        router.push(`/batches?${params.toString()}`)
    }

    // Handle limit change
    const handleLimitChange = (newLimit: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('limit', newLimit)
        params.set('page', '1') // Reset to first page
        router.push(`/batches?${params.toString()}`)
    }

    // Handle type filter change
    const handleTypeChange = (newType: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (newType === 'ALL') {
            params.delete('type')
        } else {
            params.set('type', newType)
        }
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

    // Select range of batches based on readable_id pattern
    const handleSelectRange = () => {
        if (!rangeStart || !rangeEnd) return

        const newSelected = new Set(selectedIds)

        // Sort batches by readable_id for proper range selection
        const sortedBatches = [...batches].sort((a, b) =>
            a.readable_id.localeCompare(b.readable_id)
        )

        let inRange = false
        for (const batch of sortedBatches) {
            if (batch.readable_id === rangeStart) {
                inRange = true
            }
            if (inRange) {
                newSelected.add(batch.id)
            }
            if (batch.readable_id === rangeEnd) {
                break
            }
        }

        // Also try reverse order if start > end
        if (newSelected.size === selectedIds.size) {
            let inRangeReverse = false
            for (const batch of sortedBatches.reverse()) {
                if (batch.readable_id === rangeStart) {
                    inRangeReverse = true
                }
                if (inRangeReverse) {
                    newSelected.add(batch.id)
                }
                if (batch.readable_id === rangeEnd) {
                    break
                }
            }
        }

        setSelectedIds(newSelected)
        setIsRangeDialogOpen(false)
        setRangeStart('')
        setRangeEnd('')
    }

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteBulkBatches(Array.from(selectedIds))
                setSelectedIds(new Set())
                setIsDeleteDialogOpen(false)
            } catch (err: any) {
                alert(`Error: ${err.message}`)
            }
        })
    }

    const handleMarkAsSold = () => {
        startTransition(async () => {
            try {
                await markBulkAsSold(Array.from(selectedIds))
                setSelectedIds(new Set())
                setIsSoldDialogOpen(false)
            } catch (err: any) {
                alert(`Error: ${err.message}`)
            }
        })
    }

    const selectedCount = selectedIds.size
    const isAllSelected = batches.length > 0 && selectedCount === batches.length

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by ID prefix (e.g. S-3101)"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10 pr-10 font-mono"
                    />
                    {searchInput && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Button onClick={handleSearch} variant="secondary">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                </Button>

                <div className="flex items-center gap-2 border-l pl-2 border-muted ml-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase hidden sm:inline">Type:</span>
                    <Select value={type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="w-[130px] h-9">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="GRAIN">🌾 Grain</SelectItem>
                            <SelectItem value="SUBSTRATE">🧱 Substrate</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {search && (
                    <Badge variant="outline" className="gap-1">
                        Filtering: {search}
                        <button onClick={clearSearch} className="ml-1 hover:text-red-500">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Inventory</h1>
                    {selectedCount > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                                {selectedCount} Selected
                            </Badge>

                            {/* Mark as Sold Button */}
                            <AlertDialog open={isSoldDialogOpen} onOpenChange={setIsSoldDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                                        <DollarSign className="h-4 w-4" />
                                        Mark as Sold
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="glass border-green-200">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-green-600">Mark {selectedCount} batches as sold?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will mark all selected batches as SOLD and record the sale date. They will be removed from this list and appear in the sales report.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handleMarkAsSold()
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            disabled={isPending}
                                        >
                                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Mark as Sold'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* Delete Button */}
                            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="gap-2">
                                        <Trash2 className="h-4 w-4" />
                                        Delete
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
                <div className="flex items-center gap-2">
                    {/* Range Select Dialog */}
                    <Dialog open={isRangeDialogOpen} onOpenChange={setIsRangeDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Select Range
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass">
                            <DialogHeader>
                                <DialogTitle>Select Batch Range</DialogTitle>
                                <DialogDescription>
                                    Enter the start and end batch IDs to select all batches in between.
                                    Example: S-09022026-01 to S-09022026-10
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center gap-4 py-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium mb-2 block">From</label>
                                    <Input
                                        placeholder="e.g. S-09022026-01"
                                        value={rangeStart}
                                        onChange={(e) => setRangeStart(e.target.value.toUpperCase())}
                                        className="font-mono"
                                    />
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground mt-6" />
                                <div className="flex-1">
                                    <label className="text-sm font-medium mb-2 block">To</label>
                                    <Input
                                        placeholder="e.g. S-09022026-10"
                                        value={rangeEnd}
                                        onChange={(e) => setRangeEnd(e.target.value.toUpperCase())}
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsRangeDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSelectRange} disabled={!rangeStart || !rangeEnd}>
                                    Select Range
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button asChild>
                        <Link href="/batches/create">
                            <Plus className="mr-2 h-4 w-4" /> New Batch
                        </Link>
                    </Button>
                </div>
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
                            <TableHead className="hidden md:table-cell">LC</TableHead>
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
                                    <TableCell className="hidden md:table-cell font-mono text-muted-foreground text-xs">
                                        {batch.lc_batch || batch.parent?.lc_batch || '-'}
                                    </TableCell>
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
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
