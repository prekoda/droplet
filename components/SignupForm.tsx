"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface SignupData {
    email: string
    firstName: string
    lastName: string
    username: string
    university: string
    year: string
    mobile: string
    password?: string
}

interface SignupFormProps {
    initialEmail: string
    onBack: () => void
    onSubmit: (data: SignupData) => void
    isLoading: boolean
}

export default function SignupForm({ initialEmail, onBack, onSubmit, isLoading }: SignupFormProps) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: initialEmail || "",
        mobile: "",
        university: "BPDC",
        year: "1",
        password: "",
        confirmPassword: ""
    })
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            return
        }

        onSubmit({
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            university: formData.university,
            year: formData.year,
            mobile: formData.mobile,
            password: formData.password
        })
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
                <h2 className="text-xl font-semibold tracking-tight">Create Profile</h2>
                <p className="text-sm text-muted-foreground">
                    Join the community
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
                    <input
                        type="text"
                        required
                        className="w-full rounded-lg border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email (University)</label>
                    <input
                        type="email"
                        required
                        className="w-full rounded-lg border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mobile</label>
                        <input
                            type="tel"
                            required
                            className="w-full rounded-lg border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year</label>
                        <select
                            className="w-full rounded-lg border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        >
                            {[1, 2, 3, 4].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full rounded-lg border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 pr-10"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full rounded-lg border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 pr-10"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 mt-4 shadow-lg shadow-primary/25"
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> : "Create Account"}
                </button>
            </form>
        </div>
    )
}
