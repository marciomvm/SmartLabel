import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic' // Skip static generation

async function getStats() {
  try {
    // 1. Ready Stock
    const { count: readyCount, error: err1 } = await supabase
      .from('mush_batches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'READY')

    if (err1) throw err1

    // 2. Incubating
    const { count: incubatingCount } = await supabase
      .from('mush_batches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'INCUBATING')

    // 3. Death Rate (Last 30 days)
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
    console.error("Dashboard Stats Error (Is Supabase connected?):", e)
    return { ready: 0, incubating: 0, deathRate: '0' }
  }
}

export default async function Home() {
  const stats = await getStats()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">CEO Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ready Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ready}</div>
            <p className="text-xs text-muted-foreground">Batches ready to ship</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Incubating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.incubating}</div>
            <p className="text-xs text-muted-foreground">Batches in progress</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-destructive/10 border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-destructive">Contamination Rate (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.deathRate}%</div>
          <p className="text-xs text-muted-foreground text-destructive/80">
            Of batches created in last 30 days
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
