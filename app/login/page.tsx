'use client'

import { useState, useTransition } from 'react'
import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
        <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Acesso Restrito</CardTitle>
                    <CardDescription>
                        Digite a senha do sistema para continuar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Senha de acesso"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-destructive font-medium text-center">
                                {error}
                            </p>
                        )}
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verificando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
