import { getLiquidCultures } from '@/actions/lc'
import { LCTable } from '@/components/lc/lc-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LiquidCulturesPage() {
    const cultures = await getLiquidCultures()

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">🧪 Liquid Cultures</h1>
                    <p className="text-muted-foreground">Manage your LC inventory and track age</p>
                </div>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                    <Link href="/lc/create">
                        <Plus className="mr-2 h-4 w-4" /> New LC
                    </Link>
                </Button>
            </div>

            <div className="glass p-6 rounded-3xl">
                <LCTable cultures={cultures} />
            </div>
        </div>
    )
}
