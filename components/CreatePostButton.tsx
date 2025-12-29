"use client"

import { useState } from "react"
import { X, Send, PenLine } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function CreatePostButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [text, setText] = useState("")
    const [tag, setTag] = useState<string | null>(null)
    const [isPosting, setIsPosting] = useState(false)

    const maxLength = 300
    const tags = ["Confession", "Meme", "Rant", "Question"]

    const handlePost = async () => {
        if (!text.trim()) return

        setIsPosting(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert("You must be logged in to post.")
                setIsPosting(false)
                return
            }

            // 1. Ensure Profile Exists (Self-Healing)
            const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('id', user.id)

            if (count === 0) {
                // Profile missing! Try to repair from metadata
                const meta = user.user_metadata
                if (meta?.username) {
                    const { error: profileError } = await supabase.from('profiles').insert({
                        id: user.id,
                        email: user.email,
                        first_name: meta.first_name,
                        last_name: meta.last_name,
                        username: meta.username,
                        university: meta.university || 'BPDC',
                        year: meta.year || '1',
                        mobile: meta.mobile
                    })
                    if (profileError) {
                        console.error("Auto-repair profile failed", profileError)
                        alert("Account setup incomplete. Please contact support or try logging out and back in.")
                        setIsPosting(false)
                        return
                    }
                } else {
                    alert("User profile missing. Please log out and sign up again.")
                    setIsPosting(false)
                    return
                }
            }

            // 2. Insert Post
            const { error } = await supabase.from('posts').insert({
                user_id: user.id,
                content: text,
                tag: tag
            })

            if (error) {
                console.error(error)
                alert(error.message)
            } else {
                setIsOpen(false)
                setText("")
                setTag(null)
                window.location.reload() // MVP: Refresh to show new post
            }
        } catch (err) {
            console.error(err)
            alert("Failed to post. Please try again.")
        } finally {
            setIsPosting(false)
        }
    }

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 px-6 bg-foreground text-background rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-medium z-40"
            >
                <PenLine className="h-5 w-5" />
                <span>Say something</span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">

                    <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <span className="font-medium text-sm">New Post</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-secondary rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 space-y-4">
                            <textarea
                                autoFocus
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="What's on your mind?"
                                className="w-full h-32 bg-transparent resize-none outline-none text-lg placeholder:text-muted-foreground/60"
                                maxLength={maxLength}
                            />

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {tags.map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTag(tag === t ? null : t)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${tag === t
                                                ? "bg-foreground text-background border-foreground"
                                                : "bg-background text-muted-foreground border-border hover:border-foreground/50"
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <span className={`text-xs ${text.length > 250 ? "text-orange-500" : "text-muted-foreground"}`}>
                                    {text.length}/{maxLength}
                                </span>

                                <button
                                    onClick={handlePost}
                                    disabled={!text.trim() || isPosting}
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                                >
                                    {isPosting ? "Posting..." : (
                                        <>
                                            Post <Send className="h-3.5 w-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}
