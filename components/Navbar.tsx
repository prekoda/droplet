"use client"

import { useState, useEffect } from "react"
import { Menu, X, HelpCircle, Shield, FileText, Info, LifeBuoy, MessageCircle, LogOut, UserPlus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"


export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
        })

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.reload()
    }


    const links = [
        { href: "/chat", label: "Join Chat", icon: MessageCircle },
        { href: "/faqs", label: "FAQs", icon: HelpCircle },
        { href: "/privacy", label: "Privacy Policy", icon: Shield },
        { href: "/terms", label: "Terms of Service", icon: FileText },
        { href: "/guidelines", label: "Guidelines", icon: Info },
        { href: "/support", label: "Support", icon: LifeBuoy },
    ]

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-7xl mx-auto items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full overflow-hidden">
                        <Image
                            src="/android/android-launchericon-48-48.png"
                            alt="Logo"
                            width={32}
                            height={32}
                            className="object-cover"
                        />
                    </div>
                    <span>DropLet</span>
                </Link>


                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                    {links.map((link) => (
                        <Link key={link.label} href={link.href} className="hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap">
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    ))}

                    {user && (
                        <>
                            <div className="h-4 w-px bg-border/50" />
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleLogout}
                                    className="hover:text-red-500 transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Log Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl absolute w-full animate-in slide-in-from-top-2">
                    <div className="flex flex-col p-4 space-y-4">
                        {links.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-secondary/50 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        ))}

                        {user && (
                            <>
                                <div className="h-px bg-border/50 my-2" />
                                <button
                                    onClick={() => {
                                        handleLogout()
                                        setIsOpen(false)
                                    }}
                                    className="flex w-full items-center gap-3 text-sm font-medium text-muted-foreground hover:text-red-500 p-2 rounded-md hover:bg-secondary/50 transition-colors text-left"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Log Out
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}
