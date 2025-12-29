"use client"

import { useState } from "react"
import { Menu, X, HelpCircle, Shield, FileText, Info, LifeBuoy, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

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
            <div className="container flex h-14 max-w-5xl mx-auto items-center justify-between px-4">
                <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5 text-primary"
                        >
                            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
                        </svg>
                    </div>
                    <span>DropLet</span>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                {/* Desktop Links (Hidden on mobile for now as per "phone first" focus) */}
                <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
                    {links.map((link) => (
                        <Link key={link.label} href={link.href} className="hover:text-foreground transition-colors">
                            {link.label}
                        </Link>
                    ))}
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
                    </div>
                </div>
            )}
        </nav>
    )
}
