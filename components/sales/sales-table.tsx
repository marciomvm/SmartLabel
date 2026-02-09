'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { ArrowLeft, TrendingUp, Package, Calendar } from 'lucide-react'

interface SalesTableProps {
    batches: any[]
    totalRevenue: number
    currentPeriod: string
}

const periodLabels: Record<string, string> = {
    '30d': '30 Days',
    '3m': '3 Months',
    '6m': '6 Months',
    '1y': '1 Year',
}

export function SalesTable({ batches = [], totalRevenue = 0, currentPeriod = '30d' }: SalesTableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handlePeriodChange = (period: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('period', period)
        router.push(`/sales?${params.toString()}`)
    }

    const kitsCount = batches.filter(b => b.type === 'SUBSTRATE' || b.type === 'BULK').length
    const spawnCount = batches.filter(b => b.type === 'GRAIN').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/batches">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Sales Report</h1>
                        <p className="text-sm text-muted-foreground">View sold items by time period</p>
                    </div>
                </div>
            </div>

            {/* Period Tabs */}
            <div className="flex gap-2">
                {Object.entries(periodLabels).map(([key, label]) => (
                    <Button
                        key={key}
                        variant={currentPeriod === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePeriodChange(key)}
                    >
                        {label}
                    </Button>
                ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-xl">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">Total Revenue</span>
                    </div>
                    <p className="text-3xl font-bold">£{totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Last {periodLabels[currentPeriod]}</p>
                </div>

                <div className="glass p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">Kits Sold</span>
                    </div>
                    <p className="text-3xl font-bold">{kitsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Substrate + Bulk</p>
                </div>

                <div className="glass p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 rounded-xl">
                            <Calendar className="h-5 w-5 text-amber-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">Spawn Sold</span>
                    </div>
                    <p className="text-3xl font-bold">{spawnCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Grain batches</p>
                </div>
            </div>

            {/* Sales Table */}
            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Strain</TableHead>
                            <TableHead>Parent</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Sold Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {batches.map((batch) => (
                            <TableRow key={batch.id}>
                                <TableCell className="font-mono font-medium">
                                    <Link href={`/batches/${batch.id}`} className="hover:underline">
                                        {batch.readable_id}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{batch.type}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {batch.strain?.name || '-'}
                                </TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">
                                    {batch.parent?.readable_id || '-'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(batch.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-sm font-medium text-green-600">
                                    {batch.sold_at ? new Date(batch.sold_at).toLocaleDateString() : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {batches.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No sales found for this period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Total items info */}
            {batches.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                    Showing {batches.length} sold items in the last {periodLabels[currentPeriod].toLowerCase()}
                </p>
            )}
        </div>
    )
}
