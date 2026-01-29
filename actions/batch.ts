'use server'

import { supabase } from '@/lib/supabase'
import { Batch, BatchStatus, BatchType } from '@/types'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getBatchByReadableId(readableId: string) {
    const { data, error } = await supabase
        .from('mush_batches')
        .select('*')
        .eq('readable_id', readableId)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching batch:', error)
        return null
    }

    return data as Batch | null
}

export async function createBatch(data: {
    readable_id: string
    type: BatchType
    strain_id?: string
    parent_id?: string
    parent_readable_id?: string
    notes?: string
}) {
    let finalParentId = data.parent_id

    // Resolve parent ID if provided as readable
    if (data.parent_readable_id) {
        const parent = await getBatchByReadableId(data.parent_readable_id)
        if (!parent) {
            throw new Error(`Parent batch ${data.parent_readable_id} not found.`)
        }
        // Validation: Parent must be older? Handled by user for now.
        // Validation: Parent type matches? (Grain -> Substrate). 
        // Let's enforce weak typing for now.
        finalParentId = parent.id
    }

    const { parent_readable_id, ...insertData } = data
    const payload = { ...insertData, parent_id: finalParentId }

    const { data: newBatch, error } = await supabase
        .from('mush_batches')
        .insert([payload])
        .select()
        .single()

    if (error) {
        console.error("Supabase Create Error:", error)
        throw new Error(error.message)
    }

    // Log event
    await supabase.from('mush_events').insert({
        batch_id: newBatch.id,
        action_type: 'CREATED',
        details: { initial_data: data }
    })

    revalidatePath('/batches')
    revalidatePath('/')
    return newBatch as Batch
}

export async function updateBatchStatus(id: string, status: BatchStatus) {
    const { data: batch, error } = await supabase
        .from('mush_batches')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    await supabase.from('mush_events').insert({
        batch_id: id,
        action_type: status,
        details: { previous_status: 'unknown' }
    })

    revalidatePath(`/batches/${batch.id}`)
    revalidatePath('/')
    return batch as Batch
}

export async function getStrains() {
    const { data, error } = await supabase
        .from('mush_strains')
        .select('*')
        .order('name')

    if (error) return []
    return data
}
