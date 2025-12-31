"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import LoginScreen from "@/components/LoginScreen"
import Feed from "@/components/Feed"
import UpdatePasswordForm from "@/components/UpdatePasswordForm"

export default function ChatPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [showPasswordReset, setShowPasswordReset] = useState(false)

    useEffect(() => {
        const supabase = createClient()
        let mounted = true

        // 1. Safety Timeout: Force stop loading after 3 seconds
        const timer = setTimeout(() => {
            if (mounted) setIsLoading(false)
        }, 3000)

        // 2. Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return
            if (session) {
                setIsLoggedIn(true)
                checkAndCreateProfile(session, supabase)
            }
        })

        // 3. Subscription for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            try {
                if (!mounted) return

                if (event === "PASSWORD_RECOVERY") {
                    setShowPasswordReset(true)
                    setIsLoading(false)
                    return
                }

                if (session) {
                    setIsLoggedIn(true)
                    // Profile check logic moved to helper
                    checkAndCreateProfile(session, supabase)
                } else {
                    setIsLoggedIn(false)
                }
            } catch (err) {
                console.error("Auth Error:", err)
            } finally {
                if (mounted) setIsLoading(false)
            }
        })

        return () => {
            mounted = false
            clearTimeout(timer)
            subscription.unsubscribe()
        }
    }, [])

    // Helper function to keep main effect clean
    const checkAndCreateProfile = async (session: any, supabase: any) => {
        try {
            // 1. Check if profile exists
            const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', session.user.id).single()

            if (!existingProfile) {
                // Profile missing. Attempt creation.
                const pendingProfile = localStorage.getItem("pending_profile")
                let profileData = pendingProfile ? JSON.parse(pendingProfile) : null

                // Fallback to Metadata if LocalStorage is empty
                if (!profileData && session.user.user_metadata?.username) {
                    const meta = session.user.user_metadata
                    profileData = {
                        firstName: meta.first_name,
                        lastName: meta.last_name,
                        username: meta.username,
                        university: meta.university || 'BPDC',
                        year: meta.year || '1',
                        mobile: meta.mobile
                    }
                }

                if (profileData) {
                    const { error } = await supabase.from('profiles').insert({
                        id: session.user.id,
                        email: session.user.email,
                        first_name: profileData.firstName,
                        last_name: profileData.lastName,
                        username: profileData.username,
                        university: profileData.university,
                        year: parseInt(profileData.year),
                        mobile: profileData.mobile
                    })

                    if (!error) {
                        localStorage.removeItem("pending_profile")
                    } else {
                        console.error("Error creating profile:", error)
                    }
                }
            }
        } catch (profileError) {
            console.error("Profile check failed:", profileError)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary h-6 w-6 animate-bounce"
                        >
                            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground/80 font-sans">
                    DropLet
                </h1>
            </div>
        )
    }

    if (showPasswordReset) {
        return <UpdatePasswordForm onSuccess={() => setShowPasswordReset(false)} />
    }

    if (!isLoggedIn) {
        return <LoginScreen onLoginSuccess={() => setIsLoading(true)} /> // Trigger re-check
    }

    return <Feed />
}
