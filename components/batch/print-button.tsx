'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, Loader2, Check, AlertCircle } from 'lucide-react'

interface PrintButtonProps {
    batchId: string
    batchType: string
    strain?: string
}

export function PrintLabelButton({ batchId, batchType, strain }: PrintButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [labelSize, setLabelSize] = useState('40x30')

    const handlePrint = () => {
        setStatus('idle')
        setMessage('')

        startTransition(async () => {
            try {
                // Direct fetch to local Python service (bypasses Vercel server)
                const response = await fetch('http://localhost:5000/print-label', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        batch_id: batchId,
                        batch_type: batchType,
                        strain: strain || '',
                        label_size: labelSize
                    })
                })

                const data = await response.json()

                if (data.status === 'printed' || data.success) { // Handle both response formats if needed
                    setStatus('success')
                    setMessage(data.message || 'Label ready!')
                } else {
                    setStatus('error')
                    setMessage(data.error || 'Failed to print')
                }
            } catch (err) {
                setStatus('error')
                setMessage('Print service not running. Start it with: python print-service/app.py')
            }
        })
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground ml-1">Label Size</label>
                <select
                    value={labelSize}
                    onChange={(e) => setLabelSize(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="40x30">40x30mm (Standard)</option>
                    <option value="50x30">50x30mm (Wide)</option>
                    <option value="30x15">30x15mm (Small)</option>
                    <option value="40x70">40x70mm (Vertical)</option>
                    <option value="50x50">50x50mm (Square)</option>
                </select>
            </div>

            <Button
                onClick={handlePrint}
                disabled={isPending}
                variant={status === 'success' ? 'outline' : 'default'}
                className="w-full"
            >
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Printing...
                    </>
                ) : status === 'success' ? (
                    <>
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        Printed!
                    </>
                ) : (
                    <>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Label
                    </>
                )}
            </Button>

            {message && (
                <p className={`text-xs ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {status === 'error' && <AlertCircle className="inline h-3 w-3 mr-1" />}
                    {message}
                </p>
            )}
        </div>
    )
}
