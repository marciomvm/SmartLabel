import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Calendar, Zap, Package, Printer, Search, Layout } from "lucide-react"

export default function ChangelogPage() {
    const updates = [
        {
            date: "Today, Feb 20, 2026",
            title: "Inventory Filtering & Bulk Enhancements",
            icon: <Zap className="h-5 w-5 text-amber-500" />,
            changes: [
                {
                    type: "Feature",
                    text: "Added 'Type Filter' (Grain / Substrate) to the Inventory page for better organization.",
                    icon: <Search className="h-4 w-4" />
                },
                {
                    type: "Improvement",
                    text: "New 'Add +1' button in Bulk Creation success view to quickly repeat similar entries.",
                    icon: <Zap className="h-4 w-4" />
                },
                {
                    type: "Improvement",
                    text: "Individual print buttons added to the Bulk Creation results table.",
                    icon: <Printer className="h-4 w-4" />
                },
                {
                    type: "Configuration",
                    text: "Default label size changed to 40x20mm (Economic) across the application.",
                    icon: <Package className="h-4 w-4" />
                }
            ]
        },
        {
            date: "Feb 19, 2026",
            title: "V3 Dashboard & Real-time Search",
            icon: <Sparkles className="h-5 w-5 text-purple-500" />,
            changes: [
                {
                    type: "UI/UX",
                    text: "New V3 Dashboard with a cleaner, warmer aesthetic and unified stats.",
                    icon: <Layout className="h-4 w-4" />
                },
                {
                    type: "Feature",
                    text: "Real-time search implemented in the Batches grid - no more waiting for refreshes.",
                    icon: <Search className="h-4 w-4" />
                },
                {
                    type: "Improvement",
                    text: "Enhanced LC Batch visibility in the Inventory list.",
                    icon: <Package className="h-4 w-4" />
                }
            ]
        },
        {
            date: "Earlier this week",
            title: "Sales & Sales History",
            icon: <Package className="h-5 w-5 text-emerald-500" />,
            changes: [
                {
                    type: "Feature",
                    text: "Mark as Sold functionality with custom date selection.",
                    icon: <Sparkles className="h-4 w-4" />
                },
                {
                    type: "Feature",
                    text: "Sales reporting page with 30-day summaries on the main dashboard.",
                    icon: <Layout className="h-4 w-4" />
                }
            ]
        }
    ]

    return (
        <div className="space-y-8 pb-10">
            <section className="animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-amber-500/20 p-2 rounded-xl">
                        <Sparkles className="h-6 w-6 text-amber-600" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                        What's <span className="text-gradient">New</span>? 🍄
                    </h1>
                </div>
                <p className="text-muted-foreground text-lg max-w-[600px]">
                    Track the latest improvements and features added to the FungiHub system.
                </p>
            </section>

            <div className="space-y-12">
                {updates.map((update, idx) => (
                    <div key={idx} className="relative pl-8 border-l-2 border-dashed border-muted ml-4 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
                        <div className="absolute -left-[11px] top-0 bg-background p-1">
                            <div className="h-4 w-4 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {update.date}
                            </div>

                            <Card className="glass border-none shadow-xl rounded-3xl overflow-hidden">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/50 rounded-xl shadow-sm border border-white/20">
                                            {update.icon}
                                        </div>
                                        <CardTitle className="text-2xl">{update.title}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    {update.changes.map((change, cIdx) => (
                                        <div key={cIdx} className="flex gap-4 group">
                                            <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors capitalize">
                                                {change.icon}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 border px-1.5 py-0.5 rounded leading-none">
                                                        {change.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm md:text-base leading-relaxed text-foreground/80">
                                                    {change.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ))}
            </div>

            <section className="glass p-8 rounded-3xl text-center space-y-4 mt-8">
                <h3 className="text-xl font-bold">Have a suggestion?</h3>
                <p className="text-muted-foreground">We are constantly improving the factory system based on your feedback.</p>
                <div className="pt-2">
                    <Badge variant="secondary" className="px-4 py-2 rounded-full text-amber-700 bg-amber-500/10 border-amber-500/20">
                        Version 1.4.2 Running
                    </Badge>
                </div>
            </section>
        </div>
    )
}
