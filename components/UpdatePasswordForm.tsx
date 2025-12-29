"use client"

import { useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function UpdatePasswordForm({ onSuccess }: { onSuccess: () => void }) {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
    const [message, setMessage] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus("loading")

        if (password !== confirmPassword) {
            setMessage("Passwords do not match")
            setStatus("error")
            return
        }

        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            setMessage(error.message)
            setStatus("error")
        } else {
            setMessage("Password updated successfully!")
            // Wait a moment then proceed
            setTimeout(() => {
                onSuccess()
            }, 1000)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">Set New Password</h2>
                    <p className="text-sm text-muted-foreground">
                        Please secure your account with a new password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">New Password</label>
                        <input
                            required
                            type="password"
                            minLength={6}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full rounded-md border bg-secondary/50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Confirm New Password</label>
                        <input
                            required
                            type="password"
                            minLength={6}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full rounded-md border bg-secondary/50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                        {status === "error" && <p className="text-xs text-destructive px-1">{message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Update Password <ArrowRight className="h-4 w-4" /></>}
                    </button>
                </form>
            </div>
        </div>
    )
}
