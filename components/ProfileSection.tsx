"use client"

import { LogOut, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export default function ProfileSection() {
    const [profile, setProfile] = useState<any>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('username, university, avatar_url')
                    .eq('id', user.id)
                    .single()

                if (data) setProfile(data)
            }
        }
        fetchProfile()

        // Realtime listener for own profile updates
        const channel = createClient()
            .channel('profile-section-updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, async (payload) => {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (user && payload.new.id === user.id) {
                    setProfile(payload.new)
                }
            })
            .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [])



    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.reload()
    }

    if (!profile) return null

    return (
        <div className="mb-6 p-4 rounded-xl bg-card border border-border/50 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground overflow-hidden border border-border">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-5 w-5" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">{profile.username}</h3>
                        <p className="text-xs text-muted-foreground">{profile.university}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-secondary/50"
                    title="Log out"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
