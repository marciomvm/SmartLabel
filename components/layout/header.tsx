import Link from "next/link"
import { QrCode, Home, Box, Menu, Layers, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full px-4 pt-4">
            <div className="glass max-w-lg mx-auto md:max-w-4xl h-16 px-6 rounded-2xl flex items-center justify-between transition-all duration-300">
                <Link href="/" className="font-bold text-xl flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <span className="text-2xl drop-shadow-sm">🍄</span>
                    <span className="text-gradient">Mushroom</span>
                </Link>

                <nav className="flex items-center gap-1 md:gap-3">
                    <NavButton href="/" icon={<Home className="h-5 w-5" />} label="Home" />
                    <NavButton href="/batches" icon={<Box className="h-5 w-5" />} label="Batches" />
                    <NavButton href="/batches/bulk" icon={<Layers className="h-5 w-5" />} label="Bulk Create" />
                    <NavButton href="/lc" icon={<FlaskConical className="h-5 w-5" />} label="Liquid Cultures" />
                    <NavButton href="/settings/strains" icon={<Menu className="h-5 w-5" />} label="Settings" />

                    <div className="h-8 w-[1px] bg-border mx-1 md:mx-2" />

                    <Button variant="default" size="icon" className="rounded-xl h-10 w-10 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 text-white" asChild>
                        <Link href="/scan">
                            <QrCode className="h-5 w-5" />
                            <span className="sr-only">Scan</span>
                        </Link>
                    </Button>
                </nav>
            </div>
        </header>
    )
}

function NavButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/50 transition-colors" asChild>
            <Link href={href}>
                {icon}
                <span className="sr-only">{label}</span>
            </Link>
        </Button>
    )
}
