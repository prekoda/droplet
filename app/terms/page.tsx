export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
                    <p className="text-muted-foreground">Last updated: December 29, 2025</p>
                </div>

                <div className="space-y-6 pt-8">
                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing and using DropLet, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Eligibility</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            DropLet is exclusively for verified university students. You must have a valid university email address to create an account. Misrepresenting your affiliation is grounds for immediate account termination.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">User Conduct</h2>
                        <p className="text-muted-foreground leading-relaxed mb-2">
                            You agree to use DropLet responsibly. The following behaviors are strictly prohibited:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed">
                            <li>Harassment, bullying, or hate speech</li>
                            <li>Sharing personal information of others without consent</li>
                            <li>Posting illegal content or inciting violence</li>
                            <li>Spam, scams, or fraudulent activities</li>
                            <li>Impersonating others or creating fake accounts</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Content Ownership</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You retain ownership of the content you post. However, by posting, you grant DropLet a license to display, distribute, and moderate your content on the platform.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Content Moderation</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to remove content that violates these terms or our Community Guidelines. Repeated violations may result in account suspension or permanent ban.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Service Availability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            DropLet is provided "as is" without warranties. We strive for 99% uptime but do not guarantee uninterrupted service. We may modify or discontinue features at our discretion.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            DropLet and its operators are not liable for any damages arising from your use of the platform, including but not limited to lost data, emotional distress, or reputational harm.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-semibold">Changes to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update these terms periodically. Continued use of DropLet after changes constitutes acceptance of the new terms.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
