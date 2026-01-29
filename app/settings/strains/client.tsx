'use client'

import { useState, useTransition } from 'react'
import { createStrain, deleteStrain } from '@/actions/strain'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Loader2, Plus } from 'lucide-react'

export default function StrainsPage({ strains }: { strains: any[] }) {
    const [name, setName] = useState('')
    const [days, setDays] = useState(14)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return

        startTransition(async () => {
            try {
                await createStrain(name, days)
                setName('')
                setDays(14)
            } catch (err) {
                alert('Failed to create strain')
            }
        })
    }

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure? This might break batches depending on it.')) return
        startTransition(async () => {
            await deleteStrain(id)
        })
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Strain Configuration</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Add New Strain</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Blue Oyster"
                            />
                        </div>
                        <div className="grid w-24 items-center gap-1.5">
                            <Label htmlFor="days">Days</Label>
                            <Input
                                id="days"
                                type="number"
                                value={days}
                                onChange={e => setDays(Number(e.target.value))}
                            />
                        </div>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                            Add
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Incubation Days</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {strains.map((strain) => (
                            <TableRow key={strain.id}>
                                <TableCell className="font-medium">{strain.name}</TableCell>
                                <TableCell>{strain.colonization_days} days</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(strain.id)}
                                        className="text-destructive hover:text-destructive/80"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {strains.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                    No strains defined yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
