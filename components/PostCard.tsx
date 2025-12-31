"use client"

import { MessageCircle, Flag, ThumbsUp, Send, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
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
    replyCount: number
    initialHasRelated: boolean
    avatarUrl?: string | null
    mediaUrl?: string | null
    mediaType?: string | null
}

interface Reply {
    id: string
    content: string
    user_id: string
    is_deleted: boolean
    is_edited: boolean
    profiles: {
        username: string
        avatar_url?: string | null
    }
}

export default function PostCard({ id, content, createdAt, tag, username, userId, currentUserId, onDelete, relateCount: initialRelateCount, replyCount, initialHasRelated, avatarUrl, mediaUrl, mediaType }: PostProps) {
    const [showReplies, setShowReplies] = useState(false)
    const [replies, setReplies] = useState<Reply[]>([])
    const [replyText, setReplyText] = useState("")
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
    const [editText, setEditText] = useState("")
    const [loadingReplies, setLoadingReplies] = useState(false)
    const [hasRelated, setHasRelated] = useState(initialHasRelated)
    const [relateCount, setRelateCount] = useState(initialRelateCount)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isReporting, setIsReporting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const isAuthor = currentUserId === userId
    const displayUsername = tag === "Confession" ? "Anonymous" : (username || "Unknown")

    // Check if user has already related to this post
    useEffect(() => {
        const checkRelateStatus = async () => {
            if (!currentUserId) return

            const supabase = createClient()
            console.log("Checking relate status for post:", id, "user:", currentUserId)

            const { data, error } = await supabase
                .from('interactions')
                .select('id')
                .eq('post_id', id)
                .eq('user_id', currentUserId)
                .eq('type', 'relate')
                .maybeSingle()

            if (error) {
                console.error('❌ Error checking relate status:', error)
            } else if (data) {
                console.log('✅ User IS related to post:', id)
                setHasRelated(true)
            } else {
                console.log('ℹ️ User is NOT related to post:', id)
                setHasRelated(false)
            }
        }

        checkRelateStatus()
    }, [currentUserId, id])

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true)
    }

    const confirmDelete = async () => {
        setIsDeleting(true)
        const supabase = createClient()
        console.log("🗑️ Deleting post:", id)

        // Use select() to ensure we get confirmation of what was deleted
        const { error, data } = await supabase
            .from('posts')
            .delete()
            .eq('id', id)
            .select()

        if (error) {
            console.error("❌ Delete error:", error)
            alert(`Failed to delete post: ${error.message}`)
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        } else if (!data || data.length === 0) {
            console.error("❌ Delete failed: No rows affected. RLS may be blocking deletion.")
            alert("Failed to delete post. You might not have permission.")
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        } else {
            console.log("✅ Post deleted successfully:", data)
            onDelete()
        }
    }

    const cancelDelete = () => {
        setShowDeleteConfirm(false)
    }

    const handleRelateToggle = async () => {
        if (!currentUserId) {
            alert("Please login to relate to posts")
            return
        }

        const supabase = createClient()
        console.log(`🔄 ${hasRelated ? 'Removing' : 'Adding'} relate for post:`, id)

        if (hasRelated) {
            // Remove relate
            const { error } = await supabase
                .from('interactions')
                .delete()
                .eq('post_id', id)
                .eq('user_id', currentUserId)
                .eq('type', 'relate')

            if (error) {
                console.error("❌ Error removing relate:", JSON.stringify(error, null, 2))
                alert(`Failed to remove relate: ${error.message}`)
            } else {
                console.log("✅ Relate removed")
                setHasRelated(false)
                setRelateCount(prev => prev - 1)
            }
        } else {
            // Add relate
            const { error } = await supabase
                .from('interactions')
                .insert({ post_id: id, user_id: currentUserId, type: 'relate' })

            if (error) {
                // Ignore unique constraint violation (means strictly already related)
                if (error.code === '23505') {
                    console.warn("⚠️ Already related (duplicate key ignored)")
                    setHasRelated(true)
                } else {
                    console.error("❌ Error adding relate:", JSON.stringify(error, null, 2))
                    alert(`Failed to add relate: ${error.message}`)
                }
            } else {
                console.log("✅ Relate added")
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
                .select('id, content, user_id, is_deleted, is_edited, profiles(username, avatar_url)')
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
        }).select('id, content, user_id, is_deleted, is_edited, profiles(username, avatar_url)')

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
            const { data: newReply } = await supabase.from('replies').select('id, content, user_id, is_deleted, is_edited, profiles(username, avatar_url)').eq('id', data[0].id).single()

            if (newReply) {
                setReplies([...replies, newReply as unknown as Reply])
            }
            setReplyText("")
        }
    }

    // Reply Delete Logic (Soft Delete)
    const handleDeleteReply = async (replyId: string, replyUserId: string) => {
        if (currentUserId !== replyUserId) return alert("You can only delete your own replies")
        if (!confirm("Delete reply?")) return

        const supabase = createClient()
        const { error } = await supabase
            .from('replies')
            .update({ is_deleted: true }) // Soft delete
            .eq('id', replyId)
            .eq('user_id', currentUserId)

        if (error) {
            console.error("❌ Failed to delete reply:", error)
            alert("Failed to delete reply")
        } else {
            // Optimistic update
            setReplies(prev => prev.map(r => r.id === replyId ? { ...r, is_deleted: true } : r))
        }
    }

    const handleEditReply = (reply: Reply) => {
        setEditingReplyId(reply.id)
        setEditText(reply.content)
    }

    const saveEditReply = async () => {
        if (!editingReplyId || !editText.trim()) return

        const supabase = createClient()
        const { error } = await supabase
            .from('replies')
            .update({ content: editText, is_edited: true })
            .eq('id', editingReplyId)
            .eq('user_id', currentUserId!) // Safe assertion if we show the button only for auth user

        if (error) {
            console.error("❌ Failed to edit reply:", error)
            alert("Failed to update reply")
        } else {
            // Optimistic update
            setReplies(prev => prev.map(r => r.id === editingReplyId ? { ...r, content: editText, is_edited: true } : r))
            setEditingReplyId(null)
            setEditText("")
        }
    }

    const handleReplyTag = (username: string) => {
        setReplyText(`@${username} `)
        // Ideally focus the input here, but React state update might delay render.
        // We can use a ref for the input if needed, but for now this is fine.
    }

    // Sync local state with prop when it changes (e.g. after refresh/re-fetch)
    useEffect(() => {
        setRelateCount(initialRelateCount)
    }, [initialRelateCount])

    useEffect(() => {
        setHasRelated(initialHasRelated)
    }, [initialHasRelated])

    // Realtime Replies Subscription
    useEffect(() => {
        if (!showReplies) return

        const supabase = createClient()
        const channel = supabase
            .channel(`realtime-replies-${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'replies',
                filter: `post_id=eq.${id}`
            }, async (payload) => {
                if (payload.eventType === 'INSERT') {
                    const { data: newReply, error } = await supabase
                        .from('replies')
                        .select('id, content, user_id, is_deleted, is_edited, profiles(username, avatar_url)')
                        .eq('id', payload.new.id)
                        .single()

                    if (newReply && !error) {
                        setReplies(prev => {
                            if (prev.some(r => r.id === newReply.id)) return prev
                            return [...prev, newReply as unknown as Reply]
                        })
                    }
                } else if (payload.eventType === 'DELETE') {
                    setReplies(prev => prev.filter(r => r.id !== payload.old.id))
                } else if (payload.eventType === 'UPDATE') {
                    setReplies(prev => prev.map(r =>
                        r.id === payload.new.id
                            ? { ...r, ...payload.new } // Merge updates (content, is_deleted)
                            : r
                    ))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [showReplies, id])

    return (
        <div className="w-full border-b border-border py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-secondary/50 overflow-hidden border border-white/5 flex-shrink-0">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-blue-500/10 to-purple-500/10 text-[10px] font-bold text-muted-foreground">
                                {username?.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground/90">{username || "Anonymous"}</span>
                            <span className="text-[10px] text-muted-foreground">• {createdAt}</span>
                        </div>
                        {tag && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary w-fit block mt-0.5">
                                #{tag}
                            </span>
                        )}
                    </div>
                </div>
                {isAuthor && (
                    <div className="flex items-center gap-2">
                        {!showDeleteConfirm ? (
                            <button
                                onClick={handleDeleteClick}
                                disabled={isDeleting}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        ) : (
                            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right duration-200">
                                <span className="text-[10px] text-muted-foreground mr-1">Delete?</span>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="px-2 py-0.5 text-[10px] bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? "..." : "Yes"}
                                </button>
                                <button
                                    onClick={cancelDelete}
                                    disabled={isDeleting}
                                    className="px-2 py-0.5 text-[10px] bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors disabled:opacity-50"
                                >
                                    No
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap mb-3 font-normal">
                {content}
            </p>

            {/* Media Display */}
            {mediaUrl && (
                <div className="mb-3 rounded-xl overflow-hidden border border-border/50">
                    {mediaType === 'video' ? (
                        <video src={mediaUrl} controls className="w-full max-h-96 object-contain bg-black/5" />
                    ) : (
                        <img src={mediaUrl} alt="Post media" className="w-full max-h-96 object-contain bg-black/5" />
                    )}
                </div>
            )}

            {/* Instagram-style relate count display - ALWAYS SHOW */}
            <p className="text-xs font-semibold text-foreground/90 mb-3">
                {relateCount} {relateCount === 1 ? 'relate' : 'relates'}
            </p>

            <div className="flex items-center gap-6">
                <button
                    onClick={handleRelateToggle}
                    className={cn(
                        "flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-foreground",
                        hasRelated ? "text-blue-600" : "text-muted-foreground"
                    )}
                >
                    <ThumbsUp className={cn("h-4 w-4", hasRelated && "fill-current")} />
                    <span>{hasRelated ? "Related" : "Relate"}</span>
                </button>

                <button
                    onClick={toggleReplies}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{replyCount > 0 ? `${replyCount} Replies` : 'Reply'}</span>
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
                <div className="mt-4 border-t border-border/50 pt-3">
                    {/* Scrollable Replies Container */}
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-2 mb-3 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
                        {loadingReplies && <p className="text-xs text-muted-foreground">Loading...</p>}

                        {replies.length === 0 && !loadingReplies && (
                            <p className="text-xs text-muted-foreground text-center py-2">No replies yet</p>
                        )}

                        {replies.map(reply => (
                            <div key={reply.id} className="text-sm text-foreground/80 group pl-3 border-l-2 border-border/50">
                                <div className="flex items-baseline justify-between">
                                    <div className="flex-1 mr-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="h-5 w-5 rounded-full bg-secondary/50 overflow-hidden border border-white/5 flex-shrink-0">
                                                {reply.profiles?.avatar_url ? (
                                                    <img src={reply.profiles.avatar_url} alt={reply.profiles.username} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-secondary text-[8px] font-bold text-muted-foreground">
                                                        {reply.profiles?.username?.slice(0, 1).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                                {reply.profiles?.username || "Anon"}
                                            </span>
                                        </div>

                                        {editingReplyId === reply.id ? (
                                            <div className="flex flex-col gap-2 mt-1">
                                                <textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="w-full bg-secondary/50 rounded p-2 text-sm outline-none border focus:border-primary/50"
                                                    rows={2}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={saveEditReply}
                                                        className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingReplyId(null)}
                                                        className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <p className={cn("whitespace-pre-wrap leading-relaxed", reply.is_deleted && "italic text-muted-foreground")}>
                                                    {reply.is_deleted ? "message was deleted" : reply.content}
                                                    {!reply.is_deleted && reply.is_edited && (
                                                        <span className="text-[10px] text-muted-foreground ml-2 italic">(edited)</span>
                                                    )}
                                                </p>
                                                {!reply.is_deleted && (
                                                    <button
                                                        onClick={() => handleReplyTag(reply.profiles?.username || "user")}
                                                        className="text-[10px] text-muted-foreground hover:text-foreground self-start mt-1 font-medium"
                                                    >
                                                        Reply
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {currentUserId === reply.user_id && !reply.is_deleted && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            {editingReplyId !== reply.id && (
                                                <>
                                                    <button
                                                        onClick={() => handleEditReply(reply)}
                                                        className="text-muted-foreground hover:text-foreground p-1 text-xs"
                                                        title="Edit"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteReply(reply.id, reply.user_id)}
                                                        className="text-muted-foreground hover:text-destructive p-1"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2.5 pt-1 sticky bottom-0 bg-background/95 backdrop-blur z-10">
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
            )
            }
        </div >
    )
}
