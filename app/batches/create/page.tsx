'use client'

import { useEffect, useState, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBatch, getStrains, generateNextBatchId, getReadyGrainBatches } from '@/actions/batch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Check, Printer } from 'lucide-react'
import { PrintLabelButton } from '@/components/batch/print-button'
import { BatchType } from '@/types'

function CreateBatchForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialId = searchParams.get('id') || ''
    const initialParentReadableId = searchParams.get('parent_readable_id') || ''

    const [formData, setFormData] = useState({
        readable_id: initialId,
        type: 'GRAIN' as BatchType,
        strain_id: '',
        parent_readable_id: initialParentReadableId,
        lc_batch: '',
        notes: ''
    })

    const [strains, setStrains] = useState<any[]>([])
    const [readyGrains, setReadyGrains] = useState<any[]>([])
    const [error, setError] = useState('')
    const [successBatch, setSuccessBatch] = useState<any | null>(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        // If parent ID is provided, likely we are making SUBSTRATE
        if (initialParentReadableId) {
            setFormData(prev => ({ ...prev, type: 'SUBSTRATE' }))
        }

        // Fetch strains and ready grains on mount
        const load = async () => {
            const [strainsData, grainsData] = await Promise.all([
                getStrains(),
                getReadyGrainBatches()
            ])

            setStrains(strainsData || [])
            setReadyGrains(grainsData || [])

            if (strainsData && strainsData.length > 0) {
                setFormData(prev => ({ ...prev, strain_id: strainsData[0].id }))
            }
        }
        load()
    }, [initialParentReadableId])

    // Auto-generate Batch ID when type changes
    useEffect(() => {
        // checks if readable_id is empty or follows the pattern (e.g. G-..., S-..., B-...)
        // Actually, we should probably just generate a new one if it's default or empty.
        // User might want to type manually, but "Create New" implies new ID usually.
        // Let's generate and set.
        startTransition(async () => {
            try {
                const nextId = await generateNextBatchId(formData.type)
                setFormData(prev => ({ ...prev, readable_id: nextId }))
            } catch (err) {
                console.error("Failed to generate ID", err)
            }
        })
    }, [formData.type])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.readable_id) {
            setError('Batch ID is required')
            return
        }

        startTransition(async () => {
            try {
                const newBatch = await createBatch({
                    readable_id: formData.readable_id,
                    type: formData.type,
                    strain_id: formData.strain_id,
                    parent_readable_id: formData.parent_readable_id || undefined,
                    lc_batch: formData.lc_batch || undefined,
                    notes: formData.notes
                })

                if (formData.type === 'GRAIN') {
                    // For Grain, show success screen with print option
                    setSuccessBatch(newBatch)
                    // We need the strain name for printing, let's attach it roughly or just pass what we have
                    const sName = strains.find(s => s.id === formData.strain_id)?.name
                    setSuccessBatch({ ...newBatch, strain: { name: sName } })
                } else {
                    // For Substrate, standard redirection or success? 
                    // User said: "mostrar a opcao de impressao igual eh feito atualmente no bulk subs." for Grain.
                    // "2 - Quando Adicionar batch de grao, mostrar a opcao de impressao..."
                    // Doesn't explicitly say for Substrate here, but usually Substrate also needs printing.
                    // But requirement 4 is about Substrate Parent Selection.
                    // Let's assume printing is useful for all.
                    setSuccessBatch(newBatch)
                    const sName = strains.find(s => s.id === formData.strain_id)?.name
                        || readyGrains.find(g => g.readable_id === formData.parent_readable_id)?.strain?.name
                    setSuccessBatch({ ...newBatch, strain: { name: sName } })
                }

            } catch (err: any) {
                setError(err.message || 'Failed to create')
            }
        })
    }

    if (successBatch) {
        return (
            <Card className="border-emerald-500 border-2">
                <CardHeader>
                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <Check className="h-6 w-6" />
                        <CardTitle>Batch Created Successfully!</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mb-4">
                        <h3 className="text-2xl font-mono font-bold text-center">{successBatch.readable_id}</h3>
                        <p className="text-center text-muted-foreground text-sm">{successBatch.type} • {successBatch.strain?.name}</p>
                    </div>

                    <div className="space-y-4">
                        <p className="font-semibold text-center mb-2">Print Label</p>
                        <PrintLabelButton
                            batchId={successBatch.readable_id}
                            batchType={successBatch.type}
                            strain={successBatch.strain?.name}
                            lcBatch={successBatch.lc_batch}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => router.push('/batches')}>
                            Go to List
                        </Button>
                        <Button className="flex-1" onClick={() => {
                            setSuccessBatch(null)
                            setFormData(prev => ({
                                ...prev,
                                readable_id: '', // Will regenerate
                                notes: ''
                            }))
                            // Trigger ID regen
                            setFormData(prev => ({ ...prev, type: prev.type })) // Just to trigger effect? No, effect depends on type change.
                            // We need to manually regen ID or unset it so effect picks up?
                            // Effect depends on [formData.type]. If type doesn't change, effect won't run.
                            // We should manually regen.
                            generateNextBatchId(formData.type).then(id => setFormData(p => ({ ...p, readable_id: id })))
                        }}>
                            Create Another
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Register New Batch</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="space-y-2">
                        <Label htmlFor="id">Batch ID (Barcode)</Label>
                        <Input
                            id="id"
                            value={formData.readable_id}
                            onChange={e => setFormData({ ...formData, readable_id: e.target.value })}
                            placeholder="Scan or type..."
                            className="font-mono bg-muted/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <select
                            id="type"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as BatchType })}
                        >
                            <option value="GRAIN">Grain Spawn</option>
                            <option value="SUBSTRATE">Substrate Block</option>
                            {/* BULK Removed as per request */}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="strain">Strain</Label>
                        <select
                            id="strain"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.strain_id}
                            onChange={e => setFormData({ ...formData, strain_id: e.target.value })}
                        >
                            {strains.length === 0 && <option value="">No strains found</option>}
                            {strains.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        {strains.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                (Seed strains in DB first)
                            </p>
                        )}
                    </div>

                    {formData.type === 'GRAIN' && (
                        <div className="space-y-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200 border-dashed">
                            <Label htmlFor="lc_batch" className="font-semibold text-emerald-800">Liquid Culture Batch (LC)</Label>
                            <Input
                                id="lc_batch"
                                value={formData.lc_batch}
                                onChange={e => setFormData({ ...formData, lc_batch: e.target.value })}
                                placeholder="Ex: LC-001 or MYC-202"
                                className="font-mono"
                            />
                            <p className="text-[10px] text-emerald-700">
                                Tracking for which LC was used to inoculate this grain.
                            </p>
                        </div>
                    )}

                    {formData.type !== 'GRAIN' && (
                        <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-dashed">
                            <Label htmlFor="parent">Parent Source (Ready Grain)</Label>
                            <select
                                id="parent"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                value={formData.parent_readable_id}
                                onChange={e => {
                                    const val = e.target.value
                                    setFormData({ ...formData, parent_readable_id: val })
                                    // Optionally auto-set strain if we want to track it locally
                                    const g = readyGrains.find(g => g.readable_id === val)
                                    if (g) {
                                        setFormData(prev => ({ ...prev, strain_id: g.strain_id }))
                                    }
                                }}
                            >
                                <option value="">Select a parent grain...</option>
                                {readyGrains.map(g => (
                                    <option key={g.id} value={g.readable_id}>
                                        {g.readable_id} - {g.strain?.name} ({new Date(g.created_at).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Only grains with status READY are shown.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="flex items-center gap-2">
                            Kitchen Recipe / P&D Notes
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase font-bold">R&D</span>
                        </Label>
                        <textarea
                            id="notes"
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Ex: 20% more Soybean, Autoclave at 17psi, New supplement test..."
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                            * Use this for experimental variations to track quality later.
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin mr-2" /> : 'Register Batch'}
                    </Button>

                </form>
            </CardContent>
        </Card>
    )
}

export default function CreateBatchPage() {
    // We need to wrap usage of useSearchParams in Suspense
    return (
        <div className="space-y-4 max-w-md mx-auto">
            <Button variant="ghost" asChild className="pl-0 cursor-pointer">
                <a href="/batches">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </a>
            </Button>

            <Suspense fallback={<Card><CardContent className="pt-6"><div className="flex justify-center"><Loader2 className="animate-spin" /></div></CardContent></Card>}>
                <CreateBatchForm />
            </Suspense>
        </div>
    )
}
