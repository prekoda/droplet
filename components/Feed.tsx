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
}

export default function Feed() {
    const [posts, setPosts] = useState<Post[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [schemaError, setSchemaError] = useState(false)

    useEffect(() => {
        const fetchPosts = async () => {
            const supabase = createClient()

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
                .select('*, profiles(username), interactions!left(user_id)')
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
                        .select('*, profiles(username), interactions!left(user_id)')
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
                    .select('*, profiles(username), interactions!left(user_id)')
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
