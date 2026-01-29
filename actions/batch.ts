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

export async function createBulkBatches(data: {
    parent_readable_id?: string
    strain_id?: string
    type: BatchType
    quantity: number
    notes?: string
}) {
    let parent_id: string | undefined = undefined
    let strain_id: string | undefined = data.strain_id

    // GRAIN mode: no parent, requires strain_id
    // SUBSTRATE/BULK mode: requires parent, inherits strain
    if (data.type === 'GRAIN') {
        if (!strain_id) {
            throw new Error('Strain is required for GRAIN batches.')
        }
    } else {
        if (!data.parent_readable_id) {
            throw new Error('Parent Source ID is required for SUBSTRATE/BULK batches.')
        }
        const parent = await getBatchByReadableId(data.parent_readable_id)
        if (!parent) {
            throw new Error(`Parent batch ${data.parent_readable_id} not found.`)
        }
        parent_id = parent.id
        strain_id = parent.strain_id
    }

    // Generate date prefix
    const today = new Date()
    // DDMMYYYY format
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    const dateStr = `${dd}${mm}${yyyy}`

    // Get type prefix
    const typePrefix = data.type === 'GRAIN' ? 'G' : data.type === 'SUBSTRATE' ? 'S' : 'B'

    // Find highest existing sequence for today
    const { data: existingToday } = await supabase
        .from('mush_batches')
        .select('readable_id')
        .like('readable_id', `${typePrefix}-${dateStr}-%`)
        .order('readable_id', { ascending: false })
        .limit(1)

    let startSeq = 1
    if (existingToday && existingToday.length > 0) {
        const lastId = existingToday[0].readable_id
        const lastSeq = parseInt(lastId.split('-')[2], 10)
        startSeq = lastSeq + 1
    }

    // Create batch records
    const batches = []
    for (let i = 0; i < data.quantity; i++) {
        const seq = String(startSeq + i).padStart(2, '0')
        const readable_id = `${typePrefix}-${dateStr}-${seq}`
        batches.push({
            readable_id,
            type: data.type,
            strain_id,
            parent_id,
            notes: data.notes || ''
        })
    }

    // Insert all at once
    const { data: createdBatches, error } = await supabase
        .from('mush_batches')
        .insert(batches)
        .select()

    if (error) {
        console.error("Bulk Create Error:", error)
        throw new Error(error.message)
    }

    // Log events
    for (const batch of createdBatches) {
        await supabase.from('mush_events').insert({
            batch_id: batch.id,
            action_type: 'CREATED',
            details: { bulk_created: true, parent: data.parent_readable_id || 'none' }
        })
    }

    revalidatePath('/batches')
    revalidatePath('/')
    return createdBatches as Batch[]
}

export async function deleteBatch(id: string) {
    const { error } = await supabase
        .from('mush_batches')
        .delete()
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/batches')
    revalidatePath('/')
    redirect('/batches')
}

export async function deleteBulkBatches(ids: string[]) {
    if (!ids || ids.length === 0) return

    const { error } = await supabase
        .from('mush_batches')
        .delete()
        .in('id', ids)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/batches')
    revalidatePath('/')
}
