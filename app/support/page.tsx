"use client"

import { Mail, MessageCircle, Bug } from "lucide-react"
import { useState } from "react"

export default function SupportPage() {
    const [email, setEmail] = useState("")
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // In production, this would send to an actual support system
        setSubmitted(true)
        setTimeout(() => {
            setEmail("")
            setSubject("")
            setMessage("")
            setSubmitted(false)
        }, 3000)
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold tracking-tight">Support</h1>
                    <p className="text-muted-foreground text-lg">We're here to help</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 pt-8">
                    <div className="border border-border rounded-lg p-6 space-y-3">
                        <Mail className="h-8 w-8 text-primary" />
                        <h3 className="font-semibold">Email Us</h3>
                        <p className="text-sm text-muted-foreground">support@droplet.app</p>
                    </div>
                    <div className="border border-border rounded-lg p-6 space-y-3">
                        <MessageCircle className="h-8 w-8 text-primary" />
                        <h3 className="font-semibold">Response Time</h3>
                        <p className="text-sm text-muted-foreground">Within 24 hours</p>
                    </div>
                    <div className="border border-border rounded-lg p-6 space-y-3">
                        <Bug className="h-8 w-8 text-primary" />
                        <h3 className="font-semibold">Report Bugs</h3>
                        <p className="text-sm text-muted-foreground">Help us improve</p>
                    </div>
                </div>

                <div className="space-y-6 pt-8">
                    <h2 className="text-2xl font-semibold">Contact Form</h2>

                    {submitted ? (
                        <div className="bg-primary/10 border border-primary rounded-lg p-6 text-center">
                            <p className="text-primary font-medium">Thank you! We've received your message and will respond soon.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-secondary/30 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/50"
                                    placeholder="your@university.edu"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-secondary/30 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/50"
                                    placeholder="How can we help?"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message</label>
                                <textarea
                                    required
                                    rows={6}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-secondary/30 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/50 resize-none"
                                    placeholder="Describe your issue or question..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:opacity-90 transition-opacity"
                            >
                                Send Message
                            </button>
                        </form>
                    )}
                </div>

                <div className="space-y-4 pt-8 border-t border-border">
                    <h3 className="text-xl font-semibold">Quick Answers</h3>
                    <div className="space-y-3">
                        <details className="group">
                            <summary className="cursor-pointer font-medium py-2">How do I reset my password?</summary>
                            <p className="text-muted-foreground pl-4 pb-2">
                                Click "Forgot password?" on the login screen and follow the instructions sent to your email.
                            </p>
                        </details>
                        <details className="group">
                            <summary className="cursor-pointer font-medium py-2">How do I delete my account?</summary>
                            <p className="text-muted-foreground pl-4 pb-2">
                                Contact us via this form with your account deletion request, and we'll process it within 48 hours.
                            </p>
                        </details>
                        <details className="group">
                            <summary className="cursor-pointer font-medium py-2">I found a bug. How do I report it?</summary>
                            <p className="text-muted-foreground pl-4 pb-2">
                                Use the contact form above with "Bug Report" as the subject and include steps to reproduce the issue.
                            </p>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    )
}
