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

    const { count: incubatingCount } = await supabase
      .from('mush_batches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'INCUBATING')

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentBatches } = await supabase
      .from('mush_batches')
      .select('status')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const totalRecent = recentBatches?.length || 0
    const contaminatedRecent = recentBatches?.filter(b => b.status === 'CONTAMINATED').length || 0
    const deathRate = totalRecent > 0
      ? ((contaminatedRecent / totalRecent) * 100).toFixed(1)
      : '0'

    return {
      ready: readyCount || 0,
      incubating: incubatingCount || 0,
      deathRate
    }
  } catch (e) {
    return { ready: 0, incubating: 0, deathRate: '0' }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GlassCard
          title="Ready Stock"
          value={stats.ready}
          subtitle="Batches ready to ship"
          icon={<Package className="h-6 w-6 text-emerald-600" />}
          gradient="from-emerald-500/10 to-teal-500/5"
        />

        <GlassCard
          title="Incubating"
          value={stats.incubating}
          subtitle="Batches in progress"
          icon={<Activity className="h-6 w-6 text-blue-600" />}
          gradient="from-blue-500/10 to-indigo-500/5"
        />

        <GlassCard
          title="Contamination"
          value={`${stats.deathRate}%`}
          subtitle="Rate in the last 30 days"
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
          gradient="from-red-500/10 to-orange-500/5"
          isDestructive={parseFloat(stats.deathRate) > 10}
        />
      </div>

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
              <Layers className="h-32 w-32" />
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
