"use client"

import ProfileSection from "@/components/ProfileSection"
import PostCard from "@/components/PostCard"
import CreatePostButton from "@/components/CreatePostButton"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Post {
    id: string
    content: string
    created_at: string
    tag?: string
    user_id: string
    relate_count: number
    profiles?: {
        username: string
    } | null
    interactions?: {
        user_id: string
    }[]
    replies?: {
        count: number
    }[]
}

export default function Feed() {
    const [posts, setPosts] = useState<Post[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [schemaError, setSchemaError] = useState(false)

    const [realtimeStatus, setRealtimeStatus] = useState<'CONNECTING' | 'SUBSCRIBED' | 'ERROR'>('CONNECTING')

    useEffect(() => {
        const supabase = createClient()

        const fetchPosts = async () => {

            // Check Profile
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUserId(user.id)
                const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
                if (!profile) {
                    // Zombie User Detected
                    alert("Your profile is incomplete (Legacy Account). You will be logged out to create a new profile.")
                    await supabase.auth.signOut()
                    window.location.reload()
                    return
                }
            }

            const { data, error } = await supabase
                .from('posts')
                .select('*, profiles(username), interactions!left(user_id), replies(count)')
                .order('relate_count', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) {
                // Check specifically for the missing column error
                if (error.message?.includes('relate_count') || error.code === '42703') {
                    console.warn("⚠️ Schema Mismatch: Missing 'relate_count' column. Falling back to chronological sort.")
                    setSchemaError(true)

                    // Retry without relate_count sorting
                    const { data: fallbackData } = await supabase
                        .from('posts')
                        .select('*, profiles(username), interactions!left(user_id), replies(count)')
                        .order('created_at', { ascending: false })

                    if (fallbackData) {
                        setPosts(fallbackData)
                    }
                    return
                }

                console.error("❌ Error fetching posts:", JSON.stringify(error, null, 2))
                console.error("Full error object:", error)

                // Try fallback query without relate_count
                console.log("🔄 Retrying without relate_count sorting...")
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('posts')
                    .select('*, profiles(username), interactions!left(user_id), replies(count)')
                    .order('created_at', { ascending: false })

                if (fallbackError) {
                    console.error("❌ Fallback query also failed:", JSON.stringify(fallbackError, null, 2))
                    console.error("Full fallback error:", fallbackError)
                } else if (fallbackData) {
                    console.log("✅ Loaded posts without relate_count sorting")
                    setPosts(fallbackData)
                }
                return
            }

            if (data) {
                console.log(`✅ Loaded ${data.length} posts successfully`)
                setPosts(data)
            }
        }

        fetchPosts()

        const channel = supabase
            .channel('realtime-feed')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, async (payload) => {
                console.log('🔔 Post Change:', payload.eventType)
                if (payload.eventType === 'INSERT') {
                    const { data: newPost } = await supabase
                        .from('posts')
                        .select('*, profiles(username), interactions!left(user_id)')
                        .eq('id', payload.new.id)
                        .single()

                    if (newPost) {
                        setPosts((prev) => [newPost as Post, ...prev])
                    }
                } else if (payload.eventType === 'DELETE') {
                    setPosts((prev) => prev.filter(p => p.id !== payload.old.id))
                } else if (payload.eventType === 'UPDATE') {
                    // Fetch the updated post to ensure we have all joined data (profiles, etc)
                    // This is safer than merging payload.new which lacks joined tables
                    const { data: updatedPost } = await supabase
                        .from('posts')
                        .select('*, profiles(username), interactions!left(user_id), replies(count)')
                        .eq('id', payload.new.id)
                        .single()

                    if (updatedPost) {
                        setPosts((prev) => prev.map(p =>
                            p.id === updatedPost.id ? updatedPost as Post : p
                        ))
                    }
                }
            })
            // Listen for Interactions (Likes/Relates) to update counts instantly
            // This covers the case where the DB trigger might be missing or slow
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions' }, (payload) => {
                console.log('🔔 Interaction Change:', payload.eventType)
                if (payload.eventType === 'INSERT' && payload.new.type === 'relate') {
                    setPosts((prev) => prev.map(p =>
                        p.id === payload.new.post_id
                            ? { ...p, relate_count: (p.relate_count || 0) + 1 }
                            : p
                    ))
                } else if (payload.eventType === 'DELETE' && payload.old.id) {
                    // Start by checking if we need to decrement.
                    // Ideally we'd check type but payload.old only has ID often.
                    // However, we can optimistically decrement if we think it's a relate.
                    // Better: We might not know the post_id easily from DELETE payload.old unless Replica Identity is set to Full.
                    // Fallback: We can't easily map DELETE without post_id. 
                    // BUT: Supabase typically sends `old` with primary keys.
                    // If we can't identify the post, we might skip.
                    // However, let's try to assume payload.old *might* have post_id if configured, 
                    // OR we accept we might need to rely on 'posts' update for decrements if possible.
                    // Actually, if we just listen to 'posts' UPDATE, that's cleaner IF the trigger exists.
                    // Since I'm doing this as a fallback, let's try to trust 'posts' UPDATE first, 
                    // but if that fails, this fallback handles INSERTS well (upvoting updates instantly).
                    // For DELETE (downvoting), it's harder without post_id.

                    // Let's assume standard behavior:
                    // If we get an INSERT on interaction, we increment.
                    // If we get a DELETE? We check if we have post_id.
                    if (payload.old && (payload.old as any).post_id) {
                        setPosts((prev) => prev.map(p =>
                            p.id === (payload.old as any).post_id
                                ? { ...p, relate_count: Math.max(0, (p.relate_count || 0) - 1) }
                                : p
                        ))
                    }
                }

            })
            // Listen for Replies (to update count on feed)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'replies' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setPosts((prev) => prev.map(p =>
                        p.id === payload.new.post_id
                            ? { ...p, replies: [{ count: (p.replies?.[0]?.count || 0) + 1 }] }
                            : p
                    ))
                } else if (payload.eventType === 'DELETE') {
                    // Note: payload.old usually only has 'id' unless REPLICA IDENTITY FULL is set (which we did).
                    // But even with FULL, we need to know the post_id to find the post.
                    // If we have access to post_id in old record:
                    const oldRecord = payload.old as any
                    if (oldRecord.post_id) {
                        setPosts((prev) => prev.map(p =>
                            p.id === oldRecord.post_id
                                ? { ...p, replies: [{ count: Math.max(0, (p.replies?.[0]?.count || 0) - 1) }] }
                                : p
                        ))
                    }
                }
            })
            .subscribe((status) => {
                console.log("🔌 Realtime Status:", status)
                if (status === 'SUBSCRIBED') setRealtimeStatus('SUBSCRIBED')
                if (status === 'CHANNEL_ERROR') setRealtimeStatus('ERROR')
                if (status === 'CLOSED') setRealtimeStatus('ERROR')
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <div className="w-full max-w-lg md:max-w-2xl mx-auto min-h-screen pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4 rounded-b-xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">BITS Dubai</h1>
                        <p className="text-xs text-muted-foreground">Posts reset in 30 days</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${realtimeStatus === 'SUBSCRIBED' ? 'bg-green-500 animate-pulse' :
                            realtimeStatus === 'CONNECTING' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            {realtimeStatus === 'SUBSCRIBED' ? 'LIVE' : realtimeStatus}
                        </span>
                    </div>
                </div>
                <ProfileSection />
            </header>

            {/* Schema Error Banner */}
            {schemaError && (
                <div className="mx-4 mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 text-xs flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                    <p className="font-semibold flex items-center gap-2">
                        ⚠️ Database Update Required
                    </p>
                    <p>Some features (sorting, relate counts) are disabled because the database schema is outdated.</p>
                    <div className="p-2 bg-background/50 rounded border border-border font-mono opacity-80 select-all">
                        Run fix_relate_schema.sql in Supabase
                    </div>
                </div>
            )}



            {/* Feed List */}
            <div className="px-4">
                {posts.map((post) => {
                    const initialHasRelated = post.interactions?.some(i => i.user_id === currentUserId) || false

                    return (
                        <PostCard
                            key={post.id}
                            id={post.id}
                            content={post.content}
                            createdAt={new Date(post.created_at).toLocaleDateString()}
                            tag={post.tag}
                            username={post.profiles?.username}
                            userId={post.user_id}
                            currentUserId={currentUserId}
                            relateCount={post.relate_count}
                            replyCount={post.replies?.[0]?.count || 0}
                            initialHasRelated={initialHasRelated}
                            onDelete={() => setPosts(posts.filter(p => p.id !== post.id))}
                        />
                    )
                })}
                {posts.length === 0 && (
                    <div className="py-10 text-center text-muted-foreground text-sm">
                        No posts yet. Be the first.
                    </div>
                )}




            </div>

            <CreatePostButton />
        </div>
    )
}
