"use client"

import { useState, useRef } from "react"
import { X, Send, PenLine, Image as ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function CreatePostButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [text, setText] = useState("")
    const [tag, setTag] = useState<string | null>(null)
    const [isPosting, setIsPosting] = useState(false)
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const [mediaPreview, setMediaPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const maxLength = 300
    const tags = ["Confession", "Meme", "Rant", "Question"]

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert("Image must be under 5MB")
                return
            }
            setMediaFile(file)
            setMediaPreview(URL.createObjectURL(file))
        }
    }

    const removeMedia = () => {
        setMediaFile(null)
        if (mediaPreview) URL.revokeObjectURL(mediaPreview)
        setMediaPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handlePost = async () => {
        if (!text.trim() && !mediaFile) return

        setIsPosting(true)
        console.log("🚀 Starting post creation...")

        try {
            const supabase = createClient()
            console.log("✅ Supabase client created")

            const { data: { user } } = await supabase.auth.getUser()
            console.log("👤 User:", user ? `${user.id} (${user.email})` : "NOT LOGGED IN")

            if (!user) {
                alert("You must be logged in to post.")
                setIsPosting(false)
                return
            }

            // 1. Ensure Profile Exists (Self-Healing)
            console.log("🔍 Checking if profile exists...")
            const { count, error: countError } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('id', user.id)

            if (countError) {
                console.error("❌ Error checking profile:", countError)
                alert(`Profile check failed: ${countError.message}`)
                setIsPosting(false)
                return
            }

            console.log(`📊 Profile count: ${count}`)

            if (count === 0) {
                // Profile missing! Try to repair from metadata
                console.log("⚠️ Profile missing! Attempting auto-repair...")
                const meta = user.user_metadata
                console.log("📝 User metadata:", meta)

                if (meta?.username) {
                    const profileData = {
                        id: user.id,
                        email: user.email,
                        first_name: meta.first_name,
                        last_name: meta.last_name,
                        username: meta.username,
                        university: meta.university || 'BPDC',
                        year: parseInt(meta.year) || 1,
                        mobile: meta.mobile
                    }
                    console.log("🔧 Inserting profile:", profileData)

                    const { error: profileError } = await supabase.from('profiles').insert(profileData)
                    if (profileError) {
                        console.error("❌ Auto-repair profile failed:", profileError)
                        alert("Account setup incomplete. Please contact support or try logging out and back in.")
                        setIsPosting(false)
                        return
                    }
                    console.log("✅ Profile auto-repair successful")
                } else {
                    console.error("❌ No username in metadata")
                    alert("User profile missing. Please log out and sign up again.")
                    setIsPosting(false)
                    return
                }
            }

            // 2. Upload Media (if any)
            let mediaUrl = null
            let mediaType = null

            if (mediaFile) {
                const fileExt = mediaFile.name.split('.').pop()
                const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('post_media')
                    .upload(filePath, mediaFile)

                if (uploadError) {
                    throw uploadError
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('post_media')
                    .getPublicUrl(filePath)

                mediaUrl = publicUrl
                mediaType = 'image'
            }

            // 3. Insert Post
            const postData = {
                user_id: user.id,
                content: text,
                tag: tag,
                media_url: mediaUrl,
                media_type: mediaType
            }
            console.log("📮 Inserting post:", postData)

            const { error, data } = await supabase.from('posts').insert(postData).select()
            console.log("📬 Post insert response:", { error, data })

            if (error) {
                console.error("❌ Post insert error:", error)
                alert(error.message)
            } else {
                console.log("✅ Post created successfully!")
                setIsOpen(false)
                setText("")
                setTag(null)
                removeMedia()
                window.location.reload() // MVP: Refresh to show new post
            }
        } catch (err) {
            console.error("💥 Exception caught:", err)
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

                            {/* Image Preview */}
                            {mediaPreview && (
                                <div className="relative rounded-lg overflow-hidden border border-border/50 max-h-48 group">
                                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={removeMedia}
                                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

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

                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                className="hidden"
                            />

                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-xs font-medium"
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                        <span>Image</span>
                                    </button>

                                    <span className={`text-xs ${text.length > 250 ? "text-orange-500" : "text-muted-foreground"}`}>
                                        {text.length}/{maxLength}
                                    </span>
                                </div>

                                <button
                                    onClick={handlePost}
                                    disabled={(!text.trim() && !mediaFile) || isPosting}
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
