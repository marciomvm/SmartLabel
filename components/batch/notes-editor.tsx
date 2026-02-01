'use client'

import { useState, useTransition } from 'react'
import { updateBatchNotes } from '@/actions/batch'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface NotesEditorProps {
    id: string
    initialNotes: string | null
}

export function NotesEditor({ id, initialNotes }: NotesEditorProps) {
    const [notes, setNotes] = useState(initialNotes || '')
    const [isPending, startTransition] = useTransition()
    const [isDirty, setIsDirty] = useState(false)

    const handleSave = () => {
        startTransition(async () => {
            await updateBatchNotes(id, notes)
            setIsDirty(false)
        })
    }

    const addQuickNote = (text: string) => {
        const timestamp = new Date().toLocaleDateString('pt-BR')
        const newEntry = `[${timestamp}] ${text}`
        const updatedNotes = notes ? `${notes}\n${newEntry}` : newEntry
        setNotes(updatedNotes)
        setIsDirty(true)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notes & Observations</CardTitle>
                {isDirty && (
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isPending}
                        className="h-8 bg-emerald-600 hover:bg-emerald-700"
                    >
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                        Save Changes
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={() => addQuickNote("Troca de Saco / Filtro")}
                        className="text-xs h-7"
                    >
                        <Plus className="h-3 w-3 mr-1" /> Troca de Saco
                    </Button>
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={() => addQuickNote("Possível Contaminação - Observar")}
                        className="text-xs h-7 border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    >
                        <Plus className="h-3 w-3 mr-1" /> Possível Contaminação
                    </Button>
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={() => addQuickNote("Micélio Algodonoso/Forte")}
                        className="text-xs h-7"
                    >
                        <Plus className="h-3 w-3 mr-1" /> Ótimo Crescimento
                    </Button>
                </div>
                <Textarea
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        setNotes(e.target.value)
                        setIsDirty(true)
                    }}
                    placeholder="Add notes here..."
                    className="min-h-[120px] font-mono text-sm resize-y"
                />
            </CardContent>
        </Card>
    )
}
