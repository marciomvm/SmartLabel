'use server'

import { supabase } from '@/lib/supabase'
import { LiquidCulture, LCStatus } from '@/types'

export async function getLiquidCultures() {
    const { data, error } = await supabase
        .from('mush_liquid_cultures')
        .select('*, strain:mush_strains(id, name)')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching LCs:', error)
        return []
    }
    return data as LiquidCulture[]
}

export async function generateNextLCId(): Promise<string> {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const prefix = `LC-${dateStr}-`

    const { data } = await supabase
        .from('mush_liquid_cultures')
        .select('readable_id')
        .like('readable_id', `${prefix}%`)
        .order('readable_id', { ascending: false })
        .limit(1)

    let nextNum = 1
    if (data && data.length > 0) {
        const lastId = data[0].readable_id
        const lastNum = parseInt(lastId.split('-').pop() || '0', 10)
        nextNum = lastNum + 1
    }

    return `${prefix}${String(nextNum).padStart(2, '0')}`
}

export async function createLiquidCulture(input: {
    strain_id: string
    volume_ml?: number
    notes?: string
}) {
    const readable_id = await generateNextLCId()

    const { data, error } = await supabase
        .from('mush_liquid_cultures')
        .insert({
            readable_id,
            strain_id: input.strain_id,
            volume_ml: input.volume_ml,
            notes: input.notes,
            status: 'ACTIVE'
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating LC:', error)
        throw new Error(error.message)
    }

    return data as LiquidCulture
}

export async function updateLCStatus(id: string, status: LCStatus) {
    const { error } = await supabase
        .from('mush_liquid_cultures')
        .update({ status })
        .eq('id', id)

    if (error) {
        console.error('Error updating LC status:', error)
        throw new Error(error.message)
    }
}

export async function updateLCNotes(id: string, notes: string) {
    const { error } = await supabase
        .from('mush_liquid_cultures')
        .update({ notes })
        .eq('id', id)

    if (error) {
        console.error('Error updating LC notes:', error)
        throw new Error(error.message)
    }
}

export async function deleteLiquidCulture(id: string) {
    const { error } = await supabase
        .from('mush_liquid_cultures')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting LC:', error)
        throw new Error(error.message)
    }
}
