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
                        strain: strain || ''
                    })
                })

                const data = await response.json()

                if (data.success) {
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
