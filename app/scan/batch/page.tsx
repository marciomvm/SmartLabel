'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Loader2,
    QrCode,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    Package,
    DollarSign,
    ArrowLeft,
    Send,
    Play
} from 'lucide-react'
import { getBatchByReadableId, updateBulkStatus } from '@/actions/batch'
import { BatchStatus } from '@/types'
import Link from 'next/link'

interface ScannedItem {
    id: string; // Internal UUID
    readable_id: string;
    type: string;
    strain_name?: string;
}

export default function BatchScanPage() {
    const [mode, setMode] = useState<BatchStatus>('SOLD')
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
    const [inputCode, setInputCode] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [lastScanned, setLastScanned] = useState<string | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Auto-focus input
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleScan = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const code = inputCode.trim().toUpperCase()
        if (!code) return

        // Prevent duplicates in current session
        if (scannedItems.some(item => item.readable_id === code)) {
            setError(`Item ${code} already in list`)
            setInputCode('')
            return
        }

        setIsProcessing(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const batch = await getBatchByReadableId(code) as any
            if (batch) {
                const newItem: ScannedItem = {
                    id: batch.id,
                    readable_id: batch.readable_id,
                    type: batch.type,
                    strain_name: batch.strain?.name
                }
                setScannedItems(prev => [newItem, ...prev])
                setLastScanned(code)
                setInputCode('')
                // Play success sound (mock or actual if we want)
            } else {
                setError(`Batch with ID ${code} not found.`)
                setInputCode('')
            }
        } catch (err) {
            setError('Error looking up batch.')
            console.error(err)
        } finally {
            setIsProcessing(false)
            inputRef.current?.focus()
        }
    }

    const removeItem = (readableId: string) => {
        setScannedItems(prev => prev.filter(item => item.readable_id !== readableId))
    }

    const handleSync = () => {
        if (scannedItems.length === 0) return

        startTransition(async () => {
            try {
                const ids = scannedItems.map(item => item.id)
                await updateBulkStatus(ids, mode)
                setSuccessMessage(`Successfully updated ${scannedItems.length} batches to ${mode}!`)
                setScannedItems([])
                setLastScanned(null)
            } catch (err: any) {
                setError(err.message || 'Error updating batches.')
            }
        })
    }

    const getModeLabel = (m: BatchStatus) => {
        switch (m) {
            case 'SOLD': return 'Mark as Sold'
            case 'CONTAMINATED': return 'Mark as Contaminated'
            case 'READY': return 'Mark as Ready'
            case 'INCUBATING': return 'Mark as Incubating'
            default: return m
        }
    }

    const getModeColor = (m: BatchStatus) => {
        switch (m) {
            case 'SOLD': return 'bg-green-600'
            case 'CONTAMINATED': return 'bg-red-600'
            case 'READY': return 'bg-emerald-500'
            case 'INCUBATING': return 'bg-blue-500'
            default: return 'bg-primary'
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/scan">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Batch Scanner Mode</h1>
                        <p className="text-muted-foreground">Process multiple items at once.</p>
                    </div>
                </div>
                <Badge variant="outline" className="px-3 py-1 font-mono">
                    PRO OPERATION MODE
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Control Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="glass border-2 border-primary/20 shadow-xl overflow-hidden">
                        <div className={`h-2 ${getModeColor(mode)} transition-colors duration-500`} />
                        <CardHeader>
                            <CardTitle className="text-lg">Operation Mode</CardTitle>
                            <CardDescription>Select action for scanned items</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-2">
                                {(['SOLD', 'CONTAMINATED', 'READY', 'INCUBATING'] as BatchStatus[]).map((m) => (
                                    <Button
                                        key={m}
                                        variant={mode === m ? "default" : "outline"}
                                        className={`justify-start gap-3 h-12 ${mode === m ? getModeColor(m) : ''}`}
                                        onClick={() => setMode(m)}
                                    >
                                        {m === 'SOLD' && <DollarSign className="h-4 w-4" />}
                                        {m === 'CONTAMINATED' && <AlertTriangle className="h-4 w-4" />}
                                        {m === 'READY' && <CheckCircle2 className="h-4 w-4" />}
                                        {m === 'INCUBATING' && <Package className="h-4 w-4" />}
                                        {getModeLabel(m)}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-sm text-muted-foreground">In Queue</span>
                                <span className="text-3xl font-bold">{scannedItems.length}</span>
                            </div>
                            <Button
                                className={`w-full h-14 text-lg gap-2 ${getModeColor(mode)} text-white`}
                                disabled={scannedItems.length === 0 || isPending}
                                onClick={handleSync}
                            >
                                {isPending ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="h-5 w-5" />
                                        Sync Now
                                    </>
                                )}
                            </Button>
                            {scannedItems.length > 0 && (
                                <Button
                                    variant="ghost"
                                    className="w-full text-muted-foreground hover:text-destructive"
                                    onClick={() => setScannedItems([])}
                                >
                                    Clear Queue
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Scan & List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass-dark border-0 shadow-2xl overflow-hidden">
                        <div className="p-8 space-y-6">
                            <form onSubmit={handleScan} className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-white/80">Continuous Scan Input</label>
                                        {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                    </div>
                                    <div className="relative">
                                        <Input
                                            ref={inputRef}
                                            value={inputCode}
                                            onChange={(e) => setInputCode(e.target.value)}
                                            placeholder="Scan next barcode..."
                                            className="h-20 text-3xl text-center font-mono tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/20 focus-visible:ring-primary focus-visible:border-primary"
                                            disabled={isProcessing || isPending}
                                            autoFocus
                                        />
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2">
                                            <QrCode className="h-8 w-8 text-white/20" />
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Status Feed */}
                            <div className="h-10 flex items-center justify-center">
                                {successMessage && (
                                    <div className="text-emerald-400 font-medium flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                        <CheckCircle2 className="h-5 w-5" />
                                        {successMessage}
                                    </div>
                                )}
                                {error && (
                                    <div className="text-red-400 font-medium flex items-center gap-2 animate-in shake duration-500">
                                        <AlertTriangle className="h-5 w-5" />
                                        {error}
                                    </div>
                                )}
                                {!successMessage && !error && lastScanned && (
                                    <div className="text-white/60 text-sm flex items-center gap-2 animate-in fade-in duration-300">
                                        <Play className="h-3 w-3 fill-current" />
                                        Last scanned: <span className="text-white font-mono">{lastScanned}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scanned List */}
                        <div className="bg-white/5 border-t border-white/10">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                                <span className="text-xs font-bold uppercase tracking-wider text-white/40">Scanned Items Queue</span>
                                <span className="text-xs text-white/40">{scannedItems.length} items</span>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                {scannedItems.map((item, idx) => (
                                    <div
                                        key={item.readable_id}
                                        className={`flex items-center justify-between p-4 border-b border-white/5 group hover:bg-white/5 transition-colors animate-in slide-in-from-top-2 duration-300`}
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">
                                                {scannedItems.length - idx}
                                            </div>
                                            <div>
                                                <div className="font-mono text-lg font-bold text-white">{item.readable_id}</div>
                                                <div className="text-xs text-white/50 flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-white/10 border-0 text-white/60">
                                                        {item.type}
                                                    </Badge>
                                                    <span>{item.strain_name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400 hover:bg-red-400/10"
                                            onClick={() => removeItem(item.readable_id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {scannedItems.length === 0 && (
                                    <div className="py-20 text-center text-white/20 italic">
                                        Queue is empty. Start scanning...
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
