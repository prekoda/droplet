export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
                    <p className="text-muted-foreground">Last updated: December 29, 2025</p>
                </div>

                <div className="space-y-6 pt-8">
                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Your Privacy Matters</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            At DropLet, we're committed to protecting your privacy and personal information. This policy explains how we collect, use, and safeguard your data.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Information We Collect</h2>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed">
                            <li>University email address (for verification)</li>
                            <li>Username and profile information</li>
                            <li>Posts, replies, and interactions</li>
                            <li>Device and browser information</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">How We Use Your Data</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use your information to provide, maintain, and improve DropLet services. This includes authenticating your university affiliation, displaying your content, and ensuring platform security.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Anonymous Posts</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            When you create a "Confession" post, your username is hidden from other users. However, we retain internal logs for moderation and safety purposes.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Data Retention</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Posts are automatically deleted after 30 days. Account information is retained as long as your account remains active. You can request account deletion at any time through our support page.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Third-Party Services</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use Supabase for authentication and database services. Your data is encrypted and stored securely. We do not sell your personal information to third parties.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            For privacy concerns or data requests, please visit our Support page or email privacy@droplet.app
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
