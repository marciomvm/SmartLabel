'use client'

import { useState, useTransition } from 'react'
import { LiquidCulture, LCStatus } from '@/types'
import { updateLCStatus, deleteLiquidCulture } from '@/actions/lc'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Printer, Loader2, Trash2, MoreHorizontal } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation'

interface LCTableProps {
    cultures: LiquidCulture[]
}

function getAgeDays(createdAt: string): number {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function StatusBadge({ status }: { status: LCStatus }) {
    const variants: Record<LCStatus, string> = {
        ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        EXHAUSTED: 'bg-gray-100 text-gray-700 border-gray-200',
        CONTAMINATED: 'bg-red-100 text-red-700 border-red-200'
    }
    return (
        <Badge variant="outline" className={variants[status]}>
            {status}
        </Badge>
    )
}

export function LCTable({ cultures }: LCTableProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [printingId, setPrintingId] = useState<string | null>(null)

    const handlePrint = async (lc: LiquidCulture) => {
        setPrintingId(lc.id)
        try {
            await fetch('http://localhost:5000/print-label', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch_id: lc.readable_id,
                    batch_type: 'LC',
                    strain: (lc.strain as any)?.name || 'Unknown',
                    label_size: '40x30'
                })
            })
        } catch (err) {
            console.error('Print error:', err)
        }
        setPrintingId(null)
    }

    const handleStatusChange = (id: string, status: LCStatus) => {
        startTransition(async () => {
            await updateLCStatus(id, status)
            router.refresh()
        })
    }

    const handleDelete = (id: string) => {
        if (!confirm('Delete this LC?')) return
        startTransition(async () => {
            await deleteLiquidCulture(id)
            router.refresh()
        })
    }

    if (cultures.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No liquid cultures yet. Click "New LC" to create one.
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Strain</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {cultures.map(lc => (
                    <TableRow key={lc.id}>
                        <TableCell className="font-mono font-bold">{lc.readable_id}</TableCell>
                        <TableCell>{(lc.strain as any)?.name || '-'}</TableCell>
                        <TableCell>
                            <span className="font-semibold">{getAgeDays(lc.created_at)}</span>
                            <span className="text-muted-foreground text-xs ml-1">days</span>
                        </TableCell>
                        <TableCell>{lc.volume_ml ? `${lc.volume_ml}ml` : '-'}</TableCell>
                        <TableCell><StatusBadge status={lc.status} /></TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePrint(lc)}
                                    disabled={printingId === lc.id}
                                >
                                    {printingId === lc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleStatusChange(lc.id, 'ACTIVE')}>
                                            ✅ Mark Active
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(lc.id, 'EXHAUSTED')}>
                                            ⚪ Mark Exhausted
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(lc.id, 'CONTAMINATED')}>
                                            ❌ Mark Contaminated
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(lc.id)} className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
