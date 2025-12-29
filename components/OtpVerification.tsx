"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface OtpData {
    otp: string
}

interface OtpVerificationProps {
    email: string
    onBack: () => void
    onSubmit: (otp: string) => void
    isLoading: boolean
    error?: string
}

export default function OtpVerification({ email, onBack, onSubmit, isLoading, error }: OtpVerificationProps) {
    const [otp, setOtp] = useState("")
    const [cooldown, setCooldown] = useState(30) // Start with cooldown to prevent immediate resend abuse
    const [isResending, setIsResending] = useState(false)

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => setCooldown(c => c - 1), 1000)
            return () => clearInterval(timer)
        }
    }, [cooldown])

    const handleResend = async () => {
        if (cooldown > 0) return
        setIsResending(true)

        const supabase = createClient()
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email
        })

        if (error) {
            console.error("Resend error:", error)
            // Optional: alert(error.message)
        } else {
            setCooldown(30)
        }
        setIsResending(false)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(otp)
    }

    return (
        <div className="w-full max-w-sm space-y-6 anim-fade-in">
            <div className="space-y-2">
                <button
                    onClick={onBack}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                    <ArrowLeft className="h-3 w-3" /> Back
                </button>
                <h2 className="text-xl font-semibold tracking-tight">Verify Email</h2>
                <p className="text-sm text-muted-foreground">
                    Enter the code or use the link sent to <span className="text-foreground">{email}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <input
                        required
                        type="text"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} // Numbers only
                        className="w-full rounded-md border bg-secondary/50 px-4 py-3 text-center text-lg tracking-widest outline-none focus:ring-1 focus:ring-ring"
                    />
                    {error && (
                        <p className="text-xs text-destructive px-1">{error}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading || otp.length < 6}
                    className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify & Login <ArrowRight className="h-4 w-4" /></>}
                </button>
            </form>

            <div className="text-center">
                <button
                    onClick={handleResend}
                    disabled={cooldown > 0 || isResending}
                    className="text-xs text-muted-foreground hover:text-foreground underline disabled:no-underline disabled:opacity-50 transition-all font-medium"
                >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : (isResending ? "Sending..." : "Didn't receive code? Resend")}
                </button>
            </div>
        </div>
    )
}
