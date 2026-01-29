import Link from "next/link"
import { QrCode, Home, Box, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
    return (
        <header className="border-b bg-background sticky top-0 z-50">
            <div className="flex h-16 items-center px-4 justify-between max-w-lg mx-auto md:max-w-4xl">
                <Link href="/" className="font-bold text-lg flex items-center gap-2">
                    <span className="text-xl">🍄</span>
                    <span>Mushroom</span>
                </Link>

                <nav className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <Home className="h-5 w-5" />
                            <span className="sr-only">Home</span>
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/batches">
                            <Box className="h-5 w-5" />
                            <span className="sr-only">Batches</span>
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/settings/strains" title="Settings">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Settings</span>
                        </Link>
                    </Button>
                    <Button variant="default" size="icon" className="rounded-full h-10 w-10 bg-green-600 hover:bg-green-700" asChild>
                        <Link href="/scan">
                            <QrCode className="h-5 w-5 text-white" />
                            <span className="sr-only">Scan</span>
                        </Link>
                    </Button>
                </nav>
            </div>
        </header>
    )
}
