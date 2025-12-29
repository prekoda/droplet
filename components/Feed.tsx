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
}

export default function Feed() {
    const [posts, setPosts] = useState<Post[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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
                .select('*, profiles(username)')
                .order('relate_count', { ascending: false })
                .order('created_at', { ascending: false })

            if (data) {
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

            {/* Feed List */}
            <div className="px-4">
                {posts.map((post) => (
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
                        onDelete={() => setPosts(posts.filter(p => p.id !== post.id))}
                    />
                ))}
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
