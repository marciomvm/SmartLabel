'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, QrCode } from 'lucide-react'
import { getBatchByReadableId } from '@/actions/batch'

export default function ScanPage() {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    // Auto-focus on mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    // Keep focus (optional, maybe annoying if user wants to click away)
    const handleBlur = () => {
        // inputRef.current?.focus() 
    }

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return

        setError('')

        startTransition(async () => {
            try {
                const batch = await getBatchByReadableId(code)

                if (batch) {
                    router.push(`/batches/${batch.id}`)
                } else {
                    // New batch
                    router.push(`/batches/create?id=${encodeURIComponent(code)}`)
                }
            } catch (err) {
                setError('Failed to process scan. Try again.')
                console.error(err)
            }
        })
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <Card className="w-full max-w-md border-2 border-primary/20 shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                        <QrCode className="h-6 w-6" />
                        Scan Barcode
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleScan} className="space-y-4">
                        <div className="relative">
                            <Input
                                ref={inputRef}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onBlur={handleBlur}
                                placeholder="Scan or type ID..."
                                className="h-16 text-2xl text-center font-mono tracking-wider"
                                disabled={isPending}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg"
                            disabled={isPending || !code}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Looking up...
                                </>
                            ) : (
                                'Process Scan'
                            )}
                        </Button>

                        {error && (
                            <p className="text-destructive text-center font-medium animate-pulse">
                                {error}
                            </p>
                        )}
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        <p>Scanner acts as a keyboard.</p>
                        <p>Press Enter to submit.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions for Manual Mobile Use */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <Button variant="outline" className="h-16" onClick={() => router.push('/batches/create')}>
                    Manual Create
                </Button>
                <Button variant="outline" className="h-16" onClick={() => router.push('/batches')}>
                    View List
                </Button>
            </div>
        </div>
    )
}
