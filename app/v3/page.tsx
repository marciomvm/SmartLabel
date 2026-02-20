import { supabase } from "@/lib/supabase"
import { TrendingUp, Package, Activity, AlertTriangle, ArrowRight, Layers, DollarSign, Sprout, Droplets, Zap, ChevronRight, ShieldCheck, BarChart3, Clock, Flame } from "lucide-react"
import Link from "next/link"
import { AutomationTrigger } from "@/components/automation-trigger"
import { getSoldCountLast30Days, getSixMonthInoculationStats } from "@/actions/batch"
import { InoculationChart } from "@/components/dashboard/inoculation-chart"

export const dynamic = 'force-dynamic'

async function getStats() {
    try {
        const { count: readyCount } = await supabase
            .from('mush_batches')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'READY')

        const { count: readyKitsCount } = await supabase
            .from('mush_batches')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'READY')
            .eq('type', 'SUBSTRATE')

        const { count: incubatingSpawnCount } = await supabase
            .from('mush_batches')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'INCUBATING')
            .eq('type', 'GRAIN')

        const { count: incubatingKitsCount } = await supabase
            .from('mush_batches')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'INCUBATING')
            .in('type', ['SUBSTRATE', 'BULK'])

        const { data: incubatingGrain } = await supabase
            .from('mush_batches')
            .select('*, strain:mush_strains(colonization_days)')
            .eq('status', 'INCUBATING')
            .eq('type', 'GRAIN')

        const now = new Date()
        const fiveDaysFromNow = new Date()
        fiveDaysFromNow.setDate(now.getDate() + 5)

        let readySoonCount = 0

        if (incubatingGrain) {
            incubatingGrain.forEach((batch: any) => {
                const created = new Date(batch.created_at)
                const daysToReady = batch.strain?.colonization_days || 14
                const readyDate = new Date(created)
                readyDate.setDate(created.getDate() + daysToReady)
                if (readyDate <= fiveDaysFromNow) {
                    readySoonCount++
                }
            })
        }

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const fortyFiveDaysAgo = new Date()
        fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45)

        const { data: recentBatches } = await supabase
            .from('mush_batches')
            .select('status')
            .gte('created_at', thirtyDaysAgo.toISOString())

        const { data: expiringBatches } = await supabase
            .from('mush_batches')
            .select('readable_id, created_at, type')
            .eq('status', 'INCUBATING')
            .lt('created_at', fortyFiveDaysAgo.toISOString())
            .order('created_at', { ascending: true })

        const totalRecent = recentBatches?.length || 0
        const contaminatedRecent = recentBatches?.filter(b => b.status === 'CONTAMINATED').length || 0
        const deathRate = totalRecent > 0
            ? ((contaminatedRecent / totalRecent) * 100).toFixed(1)
            : '0'

        const soldCount = await getSoldCountLast30Days()

        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        const { data: inoculatedKitsData } = await supabase
            .from('mush_batches')
            .select('id, parent:parent_id(type)')
            .eq('type', 'SUBSTRATE')
            .gte('created_at', firstDayOfMonth)

        const inoculatedKitsThisMonth = inoculatedKitsData
            ? inoculatedKitsData.filter((b: any) => b.parent?.type === 'GRAIN').length
            : 0

        return {
            ready: readyCount || 0,
            incubatingSpawn: incubatingSpawnCount || 0,
            incubatingKits: incubatingKitsCount || 0,
            deathRate,
            revenue: ((readyKitsCount || 0) + (incubatingKitsCount || 0)) * 20,
            expiring: expiringBatches || [],
            readySoon: readySoonCount,
            soldLast30Days: soldCount,
            inoculatedThisMonth: inoculatedKitsThisMonth
        }
    } catch (e) {
        return { ready: 0, incubatingSpawn: 0, incubatingKits: 0, deathRate: '0', revenue: 0, expiring: [], readySoon: 0, soldLast30Days: 0, inoculatedThisMonth: 0 }
    }
}

export default async function DashboardV3() {
    const stats = await getStats()
    const sixMonthStats = await getSixMonthInoculationStats()

    const isHealthy = parseFloat(stats.deathRate) <= 10

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#f5f0eb] to-[#efe8e0] text-[#2d2a26] relative overflow-hidden">
            {/* Subtle organic background shapes */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/30 to-orange-100/20 blur-3xl" />
                <div className="absolute -bottom-[300px] -left-[200px] w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-emerald-100/40 to-teal-50/20 blur-3xl" />
                <div className="absolute top-[50%] right-[20%] w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-violet-100/20 to-rose-50/10 blur-3xl" />
            </div>

            <div className="relative z-10 px-6 py-8 lg:px-12 lg:py-10 max-w-[1440px] mx-auto">
                <AutomationTrigger />

                {/* Header */}
                <header className="mb-10 animate-in fade-in slide-in-from-top-6 duration-700">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div>
                            <p className="text-sm font-semibold tracking-widest uppercase text-amber-600/80 mb-2">
                                🍄 Mushroom Factory
                            </p>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-[#1a1816] leading-[1.1]">
                                Good morning,
                                <br />
                                <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                                    CEO.
                                </span>
                            </h1>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/scan" className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/80 hover:bg-white border border-[#e8e2da] hover:border-amber-300 shadow-sm hover:shadow-md font-semibold text-[#3d3933] transition-all duration-300">
                                <BarChart3 className="w-5 h-5 text-amber-500 group-hover:rotate-6 transition-transform" />
                                Scanner
                            </Link>
                            <Link href="/batches" className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 font-bold text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 hover:-translate-y-0.5">
                                All Batches
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Top Row – Hero Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">

                    {/* Ready to Ship – Featured */}
                    <div className="lg:col-span-1 relative group overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 p-8 shadow-sm hover:shadow-xl transition-all duration-500">
                        <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-emerald-400/10 group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-emerald-300/10 blur-2xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2.5 bg-emerald-500 rounded-xl shadow-sm shadow-emerald-500/30">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-emerald-700 text-sm uppercase tracking-wider">Ready Stock</span>
                            </div>
                            <div className="text-6xl font-black text-emerald-900 mb-1">{stats.ready}</div>
                            <p className="text-emerald-600/80 font-medium text-sm">Batches ready to ship</p>
                        </div>
                    </div>

                    {/* Revenue */}
                    <div className="relative group overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50 border border-amber-200/60 p-8 shadow-sm hover:shadow-xl transition-all duration-500">
                        <div className="absolute -right-4 -top-4 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500">
                            <DollarSign className="w-36 h-36 text-amber-900" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-sm shadow-amber-500/30">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-amber-700 text-sm uppercase tracking-wider">Projected Value</span>
                            </div>
                            <div className="text-5xl font-black text-amber-900 mb-1">£{stats.revenue.toLocaleString()}</div>
                            <p className="text-amber-600/80 font-medium text-sm">Total inventory value</p>
                        </div>
                    </div>

                    {/* Sold + Inoculated Combo */}
                    <div className="grid grid-rows-2 gap-4">
                        <Link href="/sales" className="group relative overflow-hidden rounded-2xl bg-white/70 border border-[#e8e2da] hover:border-blue-300 p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-100 rounded-xl">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-[#1a1816]">{stats.soldLast30Days}</div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sold (30d)</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </Link>

                        <div className="relative overflow-hidden rounded-2xl bg-white/70 border border-[#e8e2da] p-5 shadow-sm flex items-center gap-4">
                            <div className="p-2 bg-fuchsia-100 rounded-xl">
                                <Sprout className="w-5 h-5 text-fuchsia-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-[#1a1816]">{stats.inoculatedThisMonth}</div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inoculated This Month</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Second Row – Pipeline Status */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">

                    {/* Incubating Spawn */}
                    <div className="relative overflow-hidden rounded-2xl bg-white/60 border border-[#e8e2da] p-6 shadow-sm hover:shadow-md transition-all group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-t-2xl" />
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                <Activity className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spawn</span>
                        </div>
                        <div className="text-4xl font-black text-[#1a1816] mb-1">{stats.incubatingSpawn}</div>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Droplets className="w-3.5 h-3.5 text-blue-400" /> Grains colonizing
                        </p>
                    </div>

                    {/* Incubating Kits */}
                    <div className="relative overflow-hidden rounded-2xl bg-white/60 border border-[#e8e2da] p-6 shadow-sm hover:shadow-md transition-all group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-t-2xl" />
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-indigo-100 rounded-lg">
                                <Layers className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kits</span>
                        </div>
                        <div className="text-4xl font-black text-[#1a1816] mb-1">{stats.incubatingKits}</div>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Substrate/Bulk
                        </p>
                    </div>

                    {/* Forecast */}
                    <div className="relative overflow-hidden rounded-2xl bg-white/60 border border-[#e8e2da] p-6 shadow-sm hover:shadow-md transition-all group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-t-2xl" />
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-amber-100 rounded-lg">
                                <Clock className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Forecast</span>
                        </div>
                        <div className="text-4xl font-black text-[#1a1816] mb-1">{stats.readySoon}</div>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-400" /> Ready in 5 days
                        </p>
                    </div>

                    {/* Health */}
                    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group border ${isHealthy ? 'bg-white/60 border-[#e8e2da]' : 'bg-red-50 border-red-200'}`}>
                        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${isHealthy ? 'bg-gradient-to-r from-emerald-400 to-green-400' : 'bg-gradient-to-r from-red-400 to-rose-400'}`} />
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`p-1.5 rounded-lg ${isHealthy ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                {isHealthy ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Health</span>
                        </div>
                        <div className={`text-4xl font-black mb-1 ${isHealthy ? 'text-emerald-700' : 'text-red-700'}`}>{stats.deathRate}%</div>
                        <p className={`text-xs font-medium ${isHealthy ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isHealthy ? '✓ Contamination low' : '⚠ Rate above threshold'}
                        </p>
                    </div>
                </div>

                {/* Chart Section */}
                <section className="mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <InoculationChart data={sixMonthStats} />
                    </div>
                </section>

                {/* Alerts Section */}
                {stats.expiring.length > 0 && (
                    <section className="mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl shadow-sm shadow-red-500/20">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-[#1a1816]">Needs Attention</h2>
                            <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full border border-red-200">
                                {stats.expiring.length} {stats.expiring.length === 1 ? 'batch' : 'batches'}
                            </span>
                        </div>

                        <div className="bg-white/60 border border-[#e8e2da] rounded-2xl overflow-hidden shadow-sm divide-y divide-[#ede8e2]">
                            {stats.expiring.slice(0, 5).map((batch: any) => (
                                <Link
                                    key={batch.readable_id}
                                    href={`/batches/${batch.readable_id}`}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-amber-50/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-8 rounded-full bg-gradient-to-b from-red-400 to-orange-400" />
                                        <div>
                                            <span className="font-bold text-[#1a1816] text-base">{batch.readable_id}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{batch.type}</span>
                                                <span className="text-xs text-slate-400">
                                                    {Math.floor((new Date().getTime() - new Date(batch.created_at).getTime()) / (1000 * 60 * 60 * 24))} days incubating
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                                </Link>
                            ))}
                            {stats.expiring.length > 5 && (
                                <Link href="/batches" className="flex items-center justify-center px-6 py-3 text-sm font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50/30 transition-colors">
                                    View all {stats.expiring.length} expiring batches →
                                </Link>
                            )}
                        </div>
                    </section>
                )}

                {/* Quick Actions */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
                    <Link href="/scan" className="group">
                        <div className="relative overflow-hidden rounded-2xl bg-white/60 border border-[#e8e2da] hover:border-emerald-300 p-7 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#1a1816]">Start Scanning</h3>
                                </div>
                                <p className="text-sm text-slate-500 mb-5">Scan labels to track production instantly.</p>
                                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">
                                    Go to Scanner <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </div>
                        </div>
                    </Link>

                    <Link href="/batches" className="group">
                        <div className="relative overflow-hidden rounded-2xl bg-white/60 border border-[#e8e2da] hover:border-blue-300 p-7 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                                        <Package className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#1a1816]">Manage Batches</h3>
                                </div>
                                <p className="text-sm text-slate-500 mb-5">Detailed view of all your cultivation batches.</p>
                                <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold text-sm">
                                    View All Batches <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </div>
                        </div>
                    </Link>
                </section>
            </div>
        </div>
    )
}
