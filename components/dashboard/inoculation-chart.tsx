'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface InoculationData {
    month: string
    grain: number
    kits: number
}

interface InoculationChartProps {
    data: InoculationData[]
}

export function InoculationChart({ data }: InoculationChartProps) {
    return (
        <Card className="col-span-1 lg:col-span-2 glass border-none shadow-xl mt-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-50" />
            <CardHeader className="relative z-10">
                <CardTitle className="text-2xl font-bold tracking-tight">Inoculation History</CardTitle>
                <CardDescription>
                    Production of Grain and Kits over the last 6 months
                </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pb-4">
                <div className="h-[350px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 0,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-50" />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'currentColor', fontSize: 13 }}
                                className="text-muted-foreground"
                                dy={10}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'currentColor', fontSize: 13 }}
                                className="text-muted-foreground"
                                allowDecimals={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar
                                dataKey="grain"
                                name="Grain Spawn"
                                fill="#f59e0b"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={50}
                            />
                            <Bar
                                dataKey="kits"
                                name="Kits (Substrates)"
                                fill="#c026d3"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={50}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
