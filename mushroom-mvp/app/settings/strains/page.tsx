import { supabase } from '@/lib/supabase'
import StrainsClient from './client'

export const dynamic = 'force-dynamic'

export default async function Page() {
    const { data: strains } = await supabase
        .from('mush_strains')
        .select('*')
        .order('name')

    return <StrainsClient strains={strains || []} />
}
