'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBulkBatches, getStrains } from '@/actions/batch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Printer, CheckCircle2, Package } from 'lucide-react'
import { BatchType, Batch } from '@/types'
import Link from 'next/link'

export default function BulkCreatePage() {
    const router = useRouter()

    const [formData, setFormData] = useState({
        parent_readable_id: '',
        strain_id: '',
        type: 'GRAIN' as BatchType,
        quantity: 10,
        notes: ''
    })

    const [strains, setStrains] = useState<any[]>([])
    const [createdBatches, setCreatedBatches] = useState<Batch[]>([])
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()
    const [isPrinting, setIsPrinting] = useState(false)
    const [labelSize, setLabelSize] = useState('40x30')

    useEffect(() => {
        getStrains().then(data => {
            setStrains(data || [])
            if (data && data.length > 0) {
                setFormData(prev => ({ ...prev, strain_id: data[0].id }))
            }
        })
    }, [])

    const isGrainMode = formData.type === 'GRAIN'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setCreatedBatches([])

        if (isGrainMode && !formData.strain_id) {
            setError('Strain is required for Grain batches')
            return
        }
        if (!isGrainMode && !formData.parent_readable_id) {
            setError('Parent Source ID is required')
            return
        }
        if (formData.quantity < 1 || formData.quantity > 100) {
            setError('Quantity must be between 1 and 100')
            return
        }

        startTransition(async () => {
            try {
                const batches = await createBulkBatches({
                    parent_readable_id: isGrainMode ? undefined : formData.parent_readable_id,
                    strain_id: isGrainMode ? formData.strain_id : undefined,
                    type: formData.type,
                    quantity: formData.quantity,
                    notes: formData.notes
                })
                setCreatedBatches(batches)
            } catch (err: any) {
                setError(err.message || 'Failed to create batches')
            }
        })
    }

    const handlePrintAll = async () => {
        setIsPrinting(true)
        try {
            for (const batch of createdBatches) {
                await fetch('http://localhost:5000/print-label', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        batch_id: batch.readable_id,
                        batch_type: batch.type,
                        strain: '',
                        label_size: labelSize
                    })
                })
                await new Promise(r => setTimeout(r, 500))
            }
        } catch (err) {
            console.error('Print error:', err)
        }
        setIsPrinting(false)
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <Button variant="ghost" asChild className="pl-0">
                <Link href="/batches">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Batches
                </Link>
            </Button>

            <div className="glass p-8 rounded-3xl">
                <h1 className="text-3xl font-bold mb-2">Bulk Create Batches</h1>
                <p className="text-muted-foreground mb-6">
                    Create multiple batches at once with auto-generated IDs.
                </p>

                {createdBatches.length === 0 ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* TYPE SELECTION (First Step) */}
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-base font-semibold">What are you creating?</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['GRAIN', 'SUBSTRATE', 'BULK'] as BatchType[]).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: t })}
                                        className={`p-4 rounded-xl border-2 text-center font-semibold transition-all ${formData.type === t
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {t === 'GRAIN' ? '🌾 Grain' : t === 'SUBSTRATE' ? '🧱 Substrate' : '🍄 Bulk'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* GRAIN MODE: Show Strain Selector */}
                        {isGrainMode && (
                            <div className="space-y-2 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <Label htmlFor="strain" className="font-semibold flex items-center gap-2">
                                    🌾 Select Strain (Cepa)
                                </Label>
                                <select
                                    id="strain"
                                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.strain_id}
                                    onChange={e => setFormData({ ...formData, strain_id: e.target.value })}
                                >
                                    {strains.length === 0 && <option value="">No strains found</option>}
                                    {strains.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-amber-700">
                                    Grain batches are the root of your production. No parent needed.
                                </p>
                            </div>
                        )}

                        {/* SUBSTRATE/BULK MODE: Show Parent Selector */}
                        {!isGrainMode && (
                            <div className="space-y-2 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <Label htmlFor="parent" className="font-semibold">
                                    {formData.type === 'SUBSTRATE' ? '🌾 Scan the Parent Grain' : '🧱 Scan the Parent Substrate'}
                                </Label>
                                <Input
                                    id="parent"
                                    value={formData.parent_readable_id}
                                    onChange={e => setFormData({ ...formData, parent_readable_id: e.target.value })}
                                    placeholder="G-20260129-01 or scan..."
                                    className="font-mono h-12 text-lg"
                                    autoFocus
                                />
                                <p className="text-xs text-blue-700">
                                    The strain will be inherited from the parent automatically.
                                </p>
                            </div>
                        )}

                        {/* QUANTITY */}
                        <div className="space-y-2">
                            <Label htmlFor="quantity" className="font-semibold">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min={1}
                                max={100}
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                className="h-12 text-lg font-bold"
                            />
                        </div>

                        {/* NOTES */}
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="flex items-center gap-2">
                                R&D Notes (Optional)
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase font-bold">P&D</span>
                            </Label>
                            <textarea
                                id="notes"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Ex: 20% more Soybean, Autoclave at 17psi..."
                            />
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full h-14 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" />
                                    Creating {formData.quantity} Batches...
                                </>
                            ) : (
                                <>
                                    <Package className="mr-2 h-5 w-5" />
                                    Generate {formData.quantity} {formData.type} Batches
                                </>
                            )}
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-emerald-600">
                            <CheckCircle2 className="h-8 w-8" />
                            <span className="text-2xl font-bold">{createdBatches.length} Batches Created!</span>
                        </div>

                        <div className="border rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-3 font-medium">#</th>
                                        <th className="text-left p-3 font-medium">Batch ID</th>
                                        <th className="text-left p-3 font-medium">Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {createdBatches.map((batch, idx) => (
                                        <tr key={batch.id} className="border-t">
                                            <td className="p-3 text-muted-foreground">{idx + 1}</td>
                                            <td className="p-3 font-mono font-bold">{batch.readable_id}</td>
                                            <td className="p-3">{batch.type}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground ml-1 uppercase tracking-wider">Label Size for Printing</label>
                            <select
                                value={labelSize}
                                onChange={(e) => setLabelSize(e.target.value)}
                                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="40x30">40x30mm (Standard)</option>
                                <option value="50x30">50x30mm (Wide)</option>
                                <option value="30x15">30x15mm (Small)</option>
                                <option value="40x70">40x70mm (Vertical)</option>
                                <option value="50x50">50x50mm (Square)</option>
                            </select>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                onClick={handlePrintAll}
                                className="flex-1 h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                                disabled={isPrinting}
                            >
                                {isPrinting ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" />
                                        Printing...
                                    </>
                                ) : (
                                    <>
                                        <Printer className="mr-2 h-5 w-5" />
                                        Print All Labels
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCreatedBatches([])
                                    setFormData({ ...formData, parent_readable_id: '' })
                                }}
                                className="h-14"
                            >
                                Create More
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
