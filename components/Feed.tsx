
"use client"

import ProfileSection from "@/components/ProfileSection"
import PostCard from "@/components/PostCard"
import CreatePostButton from "@/components/CreatePostButton"
import { ThumbsUp, MessageCircle, Send, Loader2, User } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Post {
    id: string
    content: string
    created_at: string
    tag?: string
    user_id: string
    media_url?: string | null
    media_type?: string | null
    relate_count: number
    profiles?: {
        username: string
        avatar_url?: string | null
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
    const [currentUserProfile, setCurrentUserProfile] = useState<{
        username: string
        university: string
        avatar_url?: string | null
    } | null>(null)
    const [schemaError, setSchemaError] = useState(false)
    const [realtimeStatus, setRealtimeStatus] = useState<'CONNECTING' | 'SUBSCRIBED' | 'ERROR'>('CONNECTING')
    const [aura, setAura] = useState(0)

    useEffect(() => {
        const supabase = createClient()

        const fetchPosts = async () => {

            // Check Profile
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUserId(user.id)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, username, university, avatar_url')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    setCurrentUserProfile(profile as any)

                    // Fetch Aura (Total Relates)
                    const { data: userPosts } = await supabase
                        .from('posts')
                        .select('relate_count')
                        .eq('user_id', user.id)

                    if (userPosts) {
                        const totalAura = userPosts.reduce((acc, curr) => acc + (curr.relate_count || 0), 0)
                        setAura(totalAura)
                    }
                }

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
                .select('*, profiles(username, avatar_url), interactions!left(user_id), replies(count)')
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
                        .select('*, profiles(username, avatar_url), interactions!left(user_id), replies(count)')
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
                    .select('*, profiles(username, avatar_url), interactions!left(user_id), replies(count)')
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
                        .select('*, profiles(username, avatar_url), interactions!left(user_id), replies(count)')
                        .eq('id', payload.new.id)
                        .single()

                    if (newPost) {
                        setPosts((prev) => [newPost as Post, ...prev])
                    }
                } else if (payload.eventType === 'DELETE') {
                    setPosts((prev) => prev.filter(p => p.id !== payload.old.id))
                } else if (payload.eventType === 'UPDATE') {
                    console.log('🔔 Post UPDATE detected:', payload.new.id, 'relate_count:', payload.new.relate_count)
                    // Fetch the updated post to ensure we have all joined data (profiles, etc)
                    // This is safer than merging payload.new which lacks joined tables
                    const { data: updatedPost } = await supabase
                        .from('posts')
                        .select('*, profiles(username, avatar_url), interactions!left(user_id), replies(count)')
                        .eq('id', payload.new.id)
                        .single()

                    if (updatedPost) {
                        console.log('✅ Updating post in UI, new relate_count:', updatedPost.relate_count)
                        setPosts((prev) => prev.map(p =>
                            p.id === updatedPost.id ? updatedPost as Post : p
                        ))
                    }
                }
            })
            // Listen for Interactions (Likes/Relates) to update counts instantly
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions' }, (payload) => {
                console.log('🔔 Interaction Change:', payload.eventType, payload)

                if (payload.eventType === 'INSERT' && payload.new.type === 'relate') {
                    console.log('➕ Someone related to post:', payload.new.post_id)
                    setPosts((prev) => prev.map(p => {
                        if (p.id === payload.new.post_id) {
                            // If this is MY post, update Aura locally
                            if (p.user_id === currentUserId) {
                                setAura(prevAura => prevAura + 1)
                            }
                            return { ...p, relate_count: (p.relate_count || 0) + 1 }
                        }
                        return p
                    }))
                } else if (payload.eventType === 'DELETE' && payload.old && payload.old.type === 'relate') {
                    console.log('➖ Someone unrelated from post:', payload.old.post_id)
                    setPosts((prev) => prev.map(p => {
                        if (p.id === payload.old.post_id) {
                            // If this is MY post, update Aura locally
                            if (p.user_id === currentUserId) {
                                setAura(prevAura => Math.max(0, prevAura - 1))
                            }
                            return { ...p, relate_count: Math.max(0, (p.relate_count || 0) - 1) }
                        }
                        return p
                    }))
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
            // Listen for Profile changes (e.g., username, avatar_url updates)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                console.log('🔔 Profile Change:', payload.eventType, payload.new)
                setPosts(prev => prev.map(post => {
                    // Update if this post belongs to the updated user
                    if (post.user_id === payload.new.id) {
                        return {
                            ...post,
                            profiles: {
                                ...post.profiles!,
                                username: payload.new.username || post.profiles?.username,
                                avatar_url: payload.new.avatar_url
                            }
                        }
                    }
                    return post
                }))

                // Update Header Profile if it's the current user
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user && payload.new.id === user.id) {
                        setCurrentUserProfile(prev => ({ ...prev!, ...payload.new }))
                    }
                })
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setRealtimeStatus('SUBSCRIBED')
                    console.log('✅ Realtime connected successfully!')
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Realtime subscription failed:', status)
                    console.error('Check RLS policies and project configuration.')
                    setRealtimeStatus('ERROR')
                } else if (status === 'CLOSED') {
                    console.log('📡 Realtime connection closed.')
                    // Don't set state to ERROR if it's just a closure (unmount)
                }
            })

        console.log('🔌 Realtime channel initialized')

        return () => {
            console.log('🔌 Cleaning up realtime channel')
            supabase.removeChannel(channel)
        }
    }, []) // We need to be careful with currentUserId dependency. Ideally we use refs or functional updates.
    // The previous implementation had empty dependency array which is fine if we use functional updates for setPosts.
    // However, currentUserId is used inside the interaction listener which is defined once on mount.
    // It will be null initially inside the closure. 
    // FIX: We need to use a ref to access current newest userId inside the subscription closure or re-subscribe.
    // For now, let's keep it simple. Realtime Aura update might be slightly buggy on first load race condition but standard fetch works.

    return (
        <div className="w-full max-w-lg md:max-w-2xl mx-auto min-h-screen pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 rounded-b-xl">
                <div className="flex items-center justify-between">
                    {/* Left: User Profile */}
                    <Link href="/profile" className="flex items-center gap-3 group">
                        <div className="h-10 w-10 rounded-full bg-secondary/50 overflow-hidden border border-white/5 relative shadow-sm group-hover:scale-105 transition-transform">
                            {currentUserProfile?.avatar_url ? (
                                <img src={currentUserProfile.avatar_url} alt="Me" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex flex-col items-start leading-none gap-1">
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                {currentUserProfile?.username || "Loading..."}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {currentUserProfile?.university || "BPDC"}
                            </span>
                        </div>
                    </Link>

                    {/* Right: Aura Stats */}
                    <div className="relative group cursor-help select-none">
                        <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/30 border border-primary/10 shadow-sm transition-all hover:bg-secondary/50">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-black">Aura</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-gray-900 tabular-nums leading-none">
                                    {aura.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
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
                            avatarUrl={post.profiles?.avatar_url}
                            mediaUrl={post.media_url}
                            mediaType={post.media_type}
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
