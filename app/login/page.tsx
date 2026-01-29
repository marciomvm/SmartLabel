'use client'

import { useState, useTransition } from 'react'
import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        startTransition(async () => {
            const result = await login(password)
            if (result.success) {
                router.refresh()
                router.push('/')
            } else {
                setError(result.error || 'Acesso negado')
            }
        })
    }

    return (
        <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in zoom-in-95 duration-700 px-4">
            <div className="glass w-full max-w-sm p-8 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-600" />

                <div className="text-center mb-8">
                    <div className="mx-auto bg-emerald-500/10 p-4 rounded-2xl w-fit mb-4 animate-float">
                        <Lock className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Restricted Access</h2>
                    <p className="text-sm text-muted-foreground text-balance">
                        Please enter the system password to management the factory.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 rounded-xl border-white/20 bg-white/50 backdrop-blur-sm focus:ring-emerald-500/20"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-medium text-center bg-red-50 py-2 rounded-lg border border-red-100">
                            {error}
                        </p>
                    )}

                    <Button type="submit" className="w-full h-12 rounded-xl text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 text-white" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            'Access Dashboard'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
