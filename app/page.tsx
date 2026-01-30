import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { TrendingUp, Package, Activity, AlertTriangle, ArrowRight, Layers } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

async function getStats() {
  try {
    const { count: readyCount } = await supabase
      .from('mush_batches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'READY')

    // Incubating Spawn (Grain)
    const { count: incubatingSpawnCount } = await supabase
      .from('mush_batches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'INCUBATING')
      .eq('type', 'GRAIN')

    // Incubating Kits (Substrate + Bulk)
    const { count: incubatingKitsCount } = await supabase
      .from('mush_batches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'INCUBATING')
      .in('type', ['SUBSTRATE', 'BULK'])

    // Forecast Logic
    const { data: incubatingGrain } = await supabase
      .from('mush_batches')
      .select('*, strain:mush_strains(colonization_days)')
      .eq('status', 'INCUBATING')
      .eq('type', 'GRAIN')

    const now = new Date()
    const fiveDaysFromNow = new Date()
    fiveDaysFromNow.setDate(now.getDate() + 5)

    let readySoonCount = 0
    // let overdueCount = 0 

    if (incubatingGrain) {
      incubatingGrain.forEach((batch: any) => {
        const created = new Date(batch.created_at)
        const daysToReady = batch.strain?.colonization_days || 14
        const readyDate = new Date(created)
        readyDate.setDate(created.getDate() + daysToReady)

        // Check if ready in [now, now+5] OR if it was already ready (and simply not marked yet)
        // Actually, if it's already ready (past date), it should show up? 
        // The user asked: "quantos graos vamos disponiveis nos proximos 5 dias"
        // Usually this means "becoming ready". But if it's already ready time-wise but still incubating, it's also "available soon" (immediately).

        if (readyDate <= fiveDaysFromNow) {
          readySoonCount++
        }
      })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const fortyFiveDaysAgo = new Date()
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45)

    // Stats for death rate
    const { data: recentBatches } = await supabase
      .from('mush_batches')
      .select('status')
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Expiring batches logic (Old incubating)
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

    return {
      ready: readyCount || 0,
      incubatingSpawn: incubatingSpawnCount || 0,
      incubatingKits: incubatingKitsCount || 0,
      deathRate,
      revenue: (readyCount || 0) * 20,
      expiring: expiringBatches || [],
      readySoon: readySoonCount
    }
  } catch (e) {
    return { ready: 0, incubating: 0, deathRate: '0', revenue: 0, expiring: [], readySoon: 0 }
  }
}

export default async function Home() {
  const stats = await getStats()

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Section */}
      <section className="animate-in fade-in slide-in-from-top-4 duration-1000">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl mb-2">
          Hello, <span className="text-gradient">CEO</span> 🍄
        </h1>
        <p className="text-muted-foreground text-lg max-w-[600px]">
          Management system for the mushroom factory. Here is your current production status.
        </p>
      </section>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard
          title="Ready Stock"
          value={stats.ready}
          subtitle="Batches ready to ship"
          icon={<Package className="h-6 w-6 text-emerald-600" />}
          gradient="from-emerald-500/10 to-teal-500/5"
        />

        <GlassCard
          title="Potential Revenue"
          value={`£${stats.revenue.toLocaleString()}`}
          subtitle="Stock sitting on shelf"
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          gradient="from-green-500/15 to-emerald-500/5"
        />

        <GlassCard
          title="Incubating Spawn"
          value={stats.incubatingSpawn}
          subtitle="Grains colonizing"
          icon={<Activity className="h-6 w-6 text-blue-600" />}
          gradient="from-blue-500/10 to-indigo-500/5"
        />

        <GlassCard
          title="Incubating Kits"
          value={stats.incubatingKits}
          subtitle="Substrate/Bulk growing"
          icon={<Layers className="h-6 w-6 text-indigo-600" />}
          gradient="from-indigo-500/10 to-purple-500/5"
        />

        <GlassCard
          title="Contamination"
          value={`${stats.deathRate}%`}
          subtitle="Rate (last 30 days)"
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
          gradient="from-red-500/10 to-orange-500/5"
          isDestructive={parseFloat(stats.deathRate) > 10}
        />

        <GlassCard
          title="Grain Forecast"
          value={stats.readySoon}
          subtitle="Ready in next 5 days"
          icon={<Layers className="h-6 w-6 text-amber-600" />} // import Layers if needed, or use Package
          gradient="from-amber-500/10 to-yellow-500/5"
        />
      </div>

      {/* Alerts Section (BI) */}
      {stats.expiring.length > 0 && (
        <section className="animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Action Needed / Expiring Soon</h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              {stats.expiring.length} URGENT
            </span>
          </div>
          <div className="glass overflow-hidden rounded-3xl">
            <div className="p-1 space-y-1">
              {stats.expiring.map((batch: any) => (
                <Link key={batch.readable_id} href={`/batches/${batch.readable_id}`} className="flex items-center justify-between p-4 hover:bg-white/40 transition-colors rounded-2xl group">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-500/20 p-2 rounded-xl group-hover:bg-amber-500/30 transition-colors">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {batch.readable_id}
                        <span className="text-[10px] bg-white/50 px-2 py-0.5 rounded border border-white/20">{batch.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Incubating for {Math.floor((new Date().getTime() - new Date(batch.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                  <div className="text-amber-600 font-semibold text-sm flex items-center gap-1">
                    Harvest Window <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick Access */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <Link href="/scan" className="group">
          <div className="glass p-8 rounded-3xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl relative overflow-hidden h-full">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-emerald-600 transition-colors">Start Scanning</h3>
                <p className="text-muted-foreground">Scan labels to track production instantly.</p>
              </div>
              <div className="mt-8 flex items-center gap-2 font-semibold text-emerald-600">
                Go to Scanner <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="h-32 w-32" />
            </div>
          </div>
        </Link>

        <Link href="/batches" className="group">
          <div className="glass p-8 rounded-3xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl relative overflow-hidden h-full">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">Manage Batches</h3>
                <p className="text-muted-foreground">Detailed view of all your cultivation batches.</p>
              </div>
              <div className="mt-8 flex items-center gap-2 font-semibold text-blue-600">
                View All Batches <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Package className="h-32 w-32" />
            </div>
          </div>
        </Link>
      </section>
    </div>
  )
}

function GlassCard({ title, value, subtitle, icon, gradient, isDestructive = false }: any) {
  return (
    <div className={`glass p-6 rounded-3xl border-l-4 ${isDestructive ? 'border-l-red-500' : 'border-l-emerald-500'} transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="p-2 bg-white/50 rounded-xl backdrop-blur-sm shadow-sm border border-white/20">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">{title}</h4>
        <div className="text-4xl font-bold tracking-tight mb-2">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}
