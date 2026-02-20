import { supabase } from "@/lib/supabase"
import { TrendingUp, Package, Activity, AlertTriangle, ArrowRight, Layers, DollarSign, Sprout, Wind, Droplets, Zap, ChevronRight, ShieldAlert } from "lucide-react"
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

export default async function DashboardV2() {
    const stats = await getStats()
    const sixMonthStats = await getSixMonthInoculationStats()

    return (
        <div className="min-h-screen bg-[#0a0f12] text-slate-200 relative overflow-hidden font-sans selection:bg-emerald-500/30">
            {/* Dynamic Ambient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '12s', animationDelay: '2s' }} />
            <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

            <div className="relative z-10 p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
                <AutomationTrigger />

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-8 duration-1000">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-4 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            System Online
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-2 leading-tight">
                            Factory <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-200">Overview</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium max-w-xl">
                            Real-time telemetry and management for your cultivation ecosystem.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/scan" className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl font-semibold text-white transition-all backdrop-blur-md">
                            <TrendingUp className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span>Scan Batch</span>
                        </Link>
                        <Link href="/batches" className="group flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 px-6 py-3 rounded-2xl font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5">
                            <span>All Batches</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </header>

                {/* Main Bento Grid */}
                <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">

                    {/* Hero Metric - Takes 2 columns on lg */}
                    <div className="lg:col-span-2 group relative overflow-hidden rounded-[2rem] bg-white/5 border border-white/10 hover:border-white/20 transition-all backdrop-blur-xl hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.15)] flex flex-col justify-between p-8 min-h-[220px]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] group-hover:bg-emerald-500/20 transition-colors duration-500" />
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-emerald-400 font-semibold tracking-wide uppercase text-sm mb-1">Ready to Ship</p>
                                <h3 className="text-6xl font-black text-white">{stats.ready} <span className="text-2xl text-slate-400 font-medium">units</span></h3>
                            </div>
                            <div className="bg-emerald-500/10 p-4 rounded-2xl">
                                <Package className="w-8 h-8 text-emerald-400" />
                            </div>
                        </div>
                        <div className="relative z-10 mt-6 flex items-center gap-4 text-sm font-medium text-slate-300">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                                <Wind className="w-4 h-4 text-teal-400" /> Optimal Conditions
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                                <TrendingUp className="w-4 h-4 text-emerald-400" /> High Demand
                            </div>
                        </div>
                    </div>

                    {/* Revenue Component */}
                    <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-green-900/40 to-emerald-900/20 border border-green-500/20 hover:border-green-500/40 transition-all backdrop-blur-xl p-8 flex flex-col justify-between">
                        <div className="absolute -right-6 -top-6 text-green-500/10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                            <DollarSign className="w-40 h-40" />
                        </div>
                        <div className="relative z-10">
                            <div className="p-3 bg-green-500/20 w-fit rounded-xl mb-4 border border-green-500/20">
                                <DollarSign className="w-6 h-6 text-green-400" />
                            </div>
                            <p className="text-green-300/80 font-semibold tracking-wide uppercase text-xs mb-1">Projected Value</p>
                            <h3 className="text-4xl font-bold text-white">£{stats.revenue.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Sales Recent */}
                    <Link href="/sales" className="block group relative overflow-hidden rounded-[2rem] bg-white/5 border border-white/10 hover:border-white/20 transition-all backdrop-blur-xl p-8 flex flex-col justify-between hover:-translate-y-1">
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="p-3 bg-blue-500/10 w-fit rounded-xl border border-blue-500/20">
                                <TrendingUp className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                        <div className="relative z-10 mt-6">
                            <h3 className="text-4xl font-bold text-white mb-1">{stats.soldLast30Days}</h3>
                            <p className="text-slate-400 text-sm font-medium">Sold (30 Days)</p>
                        </div>
                    </Link>

                    {/* Incubating Breakdown (Spans 2 cols) */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-px rounded-[2rem] overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5">
                        <div className="bg-slate-900/50 p-8 group relative overflow-hidden hover:bg-slate-900/70 transition-colors">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50" />
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Activity className="w-5 h-5 text-blue-400" />
                                </div>
                                <h4 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">Spawn Phase</h4>
                            </div>
                            <div className="text-5xl font-bold text-white mb-2">{stats.incubatingSpawn}</div>
                            <p className="text-blue-400/80 text-sm font-medium flex items-center gap-1.5">
                                <Sprout className="w-4 h-4" /> Grains colonizing
                            </p>
                        </div>

                        <div className="bg-slate-900/50 p-8 group relative overflow-hidden hover:bg-slate-900/70 transition-colors">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50" />
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <Layers className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h4 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">Fruiting Phase</h4>
                            </div>
                            <div className="text-5xl font-bold text-white mb-2">{stats.incubatingKits}</div>
                            <p className="text-indigo-400/80 text-sm font-medium flex items-center gap-1.5">
                                <Droplets className="w-4 h-4" /> Kits developing
                            </p>
                        </div>
                    </div>

                    {/* Forecast */}
                    <div className="group relative overflow-hidden rounded-[2rem] bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all backdrop-blur-xl p-8 flex flex-col justify-between">
                        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none" />
                        <div className="relative z-10 flex items-center gap-3 mb-6">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <h4 className="text-amber-500 font-bold text-sm tracking-widest uppercase">Harvest Forecast</h4>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-5xl font-black text-white">{stats.readySoon}</h3>
                                <span className="text-slate-400 font-medium text-lg">units</span>
                            </div>
                            <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">Expected to be ready in the <span className="text-amber-400">next 5 days</span></p>
                        </div>
                    </div>

                    {/* Health Index (Contamination) */}
                    <div className={`group relative overflow-hidden rounded-[2rem] backdrop-blur-xl p-8 flex flex-col justify-between border ${parseFloat(stats.deathRate) > 10 ? 'bg-red-900/20 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                        <div className="relative z-10 flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg ${parseFloat(stats.deathRate) > 10 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-slate-400'}`}>
                                {parseFloat(stats.deathRate) > 10 ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-4xl font-bold text-white mb-1">{stats.deathRate}%</h3>
                            <p className={`text-sm font-medium ${parseFloat(stats.deathRate) > 10 ? 'text-red-400' : 'text-slate-400'}`}>
                                Contamination Rate
                            </p>
                        </div>
                    </div>

                </main>

                {/* Charts Area */}
                <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
                        <InoculationChart data={sixMonthStats} />
                    </div>
                </section>

                {/* Action Priority Center (BI) */}
                {stats.expiring.length > 0 && (
                    <section className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-bold text-white">Priority Actions</h2>
                            <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                <Zap className="w-3 h-3" /> {stats.expiring.length} Items Expiring
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.expiring.slice(0, 6).map((batch: any, index: number) => (
                                <Link key={batch.readable_id} href={`/batches/${batch.readable_id}`} className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 p-5 rounded-2xl flex items-center justify-between transition-all backdrop-blur-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-1.5 h-10 rounded-full bg-red-500/50" />
                                        <div>
                                            <div className="font-bold text-white text-lg flex items-center gap-2">
                                                {batch.readable_id}
                                            </div>
                                            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1 font-medium">{batch.type}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </Link>
                            ))}
                            {stats.expiring.length > 6 && (
                                <Link href="/batches" className="group flex flex-col items-center justify-center p-5 rounded-2xl border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
                                    <span className="font-semibold mb-1">+{stats.expiring.length - 6} More</span>
                                    <span className="text-xs">View all batches</span>
                                </Link>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
