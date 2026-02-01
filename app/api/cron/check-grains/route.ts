import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        // 1. Fetch INCUBATING GRAIN batches
        const { data: batches, error } = await supabase
            .from('mush_batches')
            .select('id, created_at, readable_id')
            .eq('type', 'GRAIN')
            .eq('status', 'INCUBATING')

        if (error) throw error

        if (!batches || batches.length === 0) {
            return NextResponse.json({ message: 'No incubating grains found', updated: 0 })
        }

        const now = new Date()
        const updates = []

        for (const batch of batches) {
            const created = new Date(batch.created_at)
            // 12 days threshold
            const diffTime = Math.abs(now.getTime() - created.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays >= 12) {
                updates.push(batch.id)
            }
        }

        if (updates.length > 0) {
            const { error: updateError } = await supabase
                .from('mush_batches')
                .update({ status: 'READY' })
                .in('id', updates)

            if (updateError) throw updateError

            // Log automation events
            const events = updates.map(id => ({
                batch_id: id,
                action_type: 'AUTO_READY',
                details: { reason: '12_days_incubation_complete' }
            }))
            await supabase.from('mush_events').insert(events)
        }

        return NextResponse.json({
            success: true,
            checked: batches.length,
            updated: updates.length,
            updated_ids: updates
        })

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
