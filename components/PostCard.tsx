"use client"

import { MessageCircle, Flag, ThumbsUp, Send, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface PostProps {
    id: string
    content: string
    createdAt: string
    tag?: string
    username?: string
    userId: string
    currentUserId: string | null
    onDelete: () => void
    relateCount: number
}

interface Reply {
    id: string
    content: string
    user_id: string
    profiles: {
        username: string
    }
}

export default function PostCard({ id, content, createdAt, tag, username, userId, currentUserId, onDelete, relateCount: initialRelateCount }: PostProps) {
    const [showReplies, setShowReplies] = useState(false)
    const [replies, setReplies] = useState<Reply[]>([])
    const [replyText, setReplyText] = useState("")
    const [loadingReplies, setLoadingReplies] = useState(false)
    const [hasRelated, setHasRelated] = useState(false)
    const [relateCount, setRelateCount] = useState(initialRelateCount)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isReporting, setIsReporting] = useState(false)

    const isAuthor = currentUserId === userId
    const displayUsername = tag === "Confession" ? "Anonymous" : (username || "Unknown")

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return
        setIsDeleting(true)
        const supabase = createClient()
        const { error } = await supabase.from('posts').delete().eq('id', id)

        if (error) {
            console.error(error)
            alert("Failed to delete post")
            setIsDeleting(false)
        } else {
            onDelete()
        }
    }

    const handleRelateToggle = async () => {
        if (!currentUserId) {
            alert("Please login to relate to posts")
            return
        }

        const supabase = createClient()

        if (hasRelated) {
            // Remove relate
            const { error } = await supabase
                .from('interactions')
                .delete()
                .eq('post_id', id)
                .eq('user_id', currentUserId)
                .eq('type', 'relate')

            if (!error) {
                setHasRelated(false)
                setRelateCount(prev => prev - 1)
            }
        } else {
            // Add relate
            const { error } = await supabase
                .from('interactions')
                .insert({ post_id: id, user_id: currentUserId, type: 'relate' })

            if (!error) {
                setHasRelated(true)
                setRelateCount(prev => prev + 1)
            }
        }
    }

    const handleReport = async () => {
        if (!currentUserId) {
            alert("Please login to report posts")
            return
        }

        const reason = prompt("Why are you reporting this post? (optional)")
        if (reason === null) return // User cancelled

        setIsReporting(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('reports')
            .insert({ post_id: id, reported_by: currentUserId, reason: reason || null })

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                alert("You've already reported this post")
            } else {
                alert("Failed to submit report")
            }
        } else {
            alert("Report submitted. Our team will review it shortly.")
        }
        setIsReporting(false)
    }

    const toggleReplies = async () => {
        const nextState = !showReplies
        setShowReplies(nextState)

        if (nextState && replies.length === 0) {
            setLoadingReplies(true)
            const supabase = createClient()
            const { data } = await supabase
                .from('replies')
                .select('id, content, user_id, profiles(username)')
                .eq('post_id', id)
                .order('created_at', { ascending: true })

            if (data) {
                setReplies(data as unknown as Reply[])
            }
            setLoadingReplies(false)
        }
    }

    const handleReplySubmit = async () => {
        if (!replyText.trim()) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return alert("Please login to reply")

        const { data, error } = await supabase.from('replies').insert({
            post_id: id,
            user_id: user.id,
            content: replyText
        }).select('id, content, user_id, profiles(username)')

        if (data) {
            // Optimistic update mechanism would be better, but we need the joined profile data
            // Since insert doesn't return joined data easily without another select, 
            // we might just fake it for the UI if we have the username in metadata/state, 
            // but for now let's just push what we can or re-fetch.
            // Actually, we can just use the current user's known username if available in a context, 
            // but we don't have it passed here easily besides fetching.
            // Simplified: Add content, show "You" or fallback.

            // To properly show the name, we'd need to fetch properly. 
            // For MVP: let's reload replies or just append with a placeholder name if needed.

            // Quick Fix: Fetch the just-inserted row fully
            const { data: newReply } = await supabase.from('replies').select('id, content, user_id, profiles(username)').eq('id', data[0].id).single()

            if (newReply) {
                setReplies([...replies, newReply as unknown as Reply])
            }
            setReplyText("")
        }
    }

    // Reply Delete Logic (Inline for MVP)
    const handleDeleteReply = async (replyId: string) => {
        if (!confirm("Delete reply?")) return
        const supabase = createClient()
        const { error } = await supabase.from('replies').delete().eq('id', replyId)
        if (!error) {
            setReplies(replies.filter(r => r.id !== replyId))
        }
    }

    return (
        <div className="w-full border-b border-border py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">{displayUsername}</span>
                    <span>•</span>
                    <span>{createdAt}</span>
                    {tag && (
                        <>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-secondary text-[10px] font-medium uppercase tracking-wider text-secondary-foreground">
                                {tag}
                            </span>
                        </>
                    )}
                </div>
                {isAuthor && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap mb-4 font-normal">
                {content}
            </p>

            <div className="flex items-center gap-6">
                <button
                    onClick={handleRelateToggle}
                    className={cn(
                        "flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-foreground",
                        hasRelated ? "text-blue-600" : "text-muted-foreground"
                    )}
                >
                    <ThumbsUp className={cn("h-3.5 w-3.5", hasRelated && "fill-current")} />
                    <span>Relate</span>
                    {relateCount > 0 && <span className="text-xs">({relateCount})</span>}
                </button>

                <button
                    onClick={toggleReplies}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Reply</span>
                </button>

                <div className="flex-1" />

                <button
                    onClick={handleReport}
                    disabled={isReporting}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/50 transition-colors hover:text-destructive disabled:opacity-50"
                >
                    <Flag className="h-3.5 w-3.5" />
                </button>
            </div>

            {showReplies && (
                <div className="mt-4 pl-4 border-l-2 border-border/50 space-y-3">
                    {loadingReplies && <p className="text-xs text-muted-foreground">Loading...</p>}

                    {replies.map(reply => (
                        <div key={reply.id} className="text-sm text-foreground/80 group">
                            <div className="flex items-baseline justify-between">
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-2 font-bold">
                                        {reply.profiles?.username || "Anon"}
                                    </span>
                                    {reply.content}
                                </div>
                                {currentUserId === reply.user_id && (
                                    <button
                                        onClick={() => handleDeleteReply(reply.id)}
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="flex gap-2.5 mt-2">
                        <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Add a reply..."
                            className="flex-1 bg-secondary/30 rounded-full px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring/50"
                            onKeyDown={(e) => e.key === "Enter" && handleReplySubmit()}
                        />
                        <button
                            onClick={handleReplySubmit}
                            disabled={!replyText.trim()}
                            className="bg-primary text-primary-foreground p-1.5 rounded-full disabled:opacity-50"
                        >
                            <Send className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
