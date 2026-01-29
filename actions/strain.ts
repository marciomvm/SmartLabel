'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function createStrain(name: string, colonization_days: number) {
    const { data, error } = await supabase
        .from('mush_strains')
        .insert([{ name, colonization_days }])
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/settings/strains')
    revalidatePath('/batches/create')
    return data
}

export async function deleteStrain(id: string) {
    const { error } = await supabase
        .from('mush_strains')
        .delete()
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/settings/strains')
}
