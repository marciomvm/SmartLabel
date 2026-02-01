'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createLiquidCulture } from '@/actions/lc'
import { getStrains } from '@/actions/batch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Check, Printer } from 'lucide-react'
import Link from 'next/link'

export default function CreateLCPage() {
    const router = useRouter()
    const [strains, setStrains] = useState<any[]>([])
    const [formData, setFormData] = useState({
        strain_id: '',
        volume_ml: 100,
        notes: ''
    })
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()
    const [createdLC, setCreatedLC] = useState<any>(null)
    const [isPrinting, setIsPrinting] = useState(false)

    useEffect(() => {
        getStrains().then(data => {
            setStrains(data || [])
            if (data && data.length > 0) {
                setFormData(prev => ({ ...prev, strain_id: data[0].id }))
            }
        })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.strain_id) {
            setError('Strain is required')
            return
        }

        startTransition(async () => {
            try {
                const lc = await createLiquidCulture({
                    strain_id: formData.strain_id,
                    volume_ml: formData.volume_ml || undefined,
                    notes: formData.notes || undefined
                })
                setCreatedLC(lc)
            } catch (err: any) {
                setError(err.message || 'Failed to create LC')
            }
        })
    }

    const handlePrint = async () => {
        if (!createdLC) return
        setIsPrinting(true)
        try {
            const strain = strains.find(s => s.id === createdLC.strain_id)
            await fetch('http://localhost:5000/print-label', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch_id: createdLC.readable_id,
                    batch_type: 'LC',
                    strain: strain?.name || 'Unknown',
                    label_size: '40x30'
                })
            })
        } catch (err) {
            console.error('Print error:', err)
        }
        setIsPrinting(false)
    }

    if (createdLC) {
        const strain = strains.find(s => s.id === createdLC.strain_id)
        return (
            <div className="space-y-6 max-w-lg mx-auto">
                <div className="glass p-8 rounded-3xl text-center space-y-6">
                    <div className="flex items-center justify-center gap-3 text-emerald-600">
                        <Check className="h-10 w-10" />
                        <span className="text-2xl font-bold">LC Created!</span>
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-2xl space-y-2">
                        <p className="text-4xl font-mono font-bold text-emerald-700">{createdLC.readable_id}</p>
                        <p className="text-muted-foreground">{strain?.name}</p>
                    </div>

                    <div className="flex gap-4">
                        <Button onClick={handlePrint} className="flex-1 h-14 bg-blue-600 hover:bg-blue-700" disabled={isPrinting}>
                            {isPrinting ? <Loader2 className="animate-spin mr-2" /> : <Printer className="mr-2 h-5 w-5" />}
                            Print Label
                        </Button>
                        <Button variant="outline" className="h-14" onClick={() => router.push('/lc')}>
                            Done
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            <Button variant="ghost" asChild className="pl-0">
                <Link href="/lc">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to LCs
                </Link>
            </Button>

            <div className="glass p-8 rounded-3xl">
                <h1 className="text-3xl font-bold mb-2">🧪 New Liquid Culture</h1>
                <p className="text-muted-foreground mb-6">Create a new LC entry</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="strain" className="font-semibold">Strain (Cepa)</Label>
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="volume" className="font-semibold">Volume (ml)</Label>
                        <Input
                            id="volume"
                            type="number"
                            min={1}
                            value={formData.volume_ml}
                            onChange={e => setFormData({ ...formData, volume_ml: parseInt(e.target.value) || 100 })}
                            className="h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <textarea
                            id="notes"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Recipe, source, etc."
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
                                Creating...
                            </>
                        ) : (
                            'Create Liquid Culture'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
