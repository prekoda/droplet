export default function FAQsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
                    <p className="text-muted-foreground text-lg">Everything you need to know about DropLet</p>
                </div>

                <div className="space-y-6 pt-8">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-semibold">What is DropLet?</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            DropLet is a private, university-focused social platform where students can share thoughts, ask questions, and connect with peers anonymously or publicly. Posts reset every 30 days to keep conversations fresh and relevant.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-semibold">How does the Confession tag work?</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            When you tag a post as "Confession," your identity remains completely anonymous. Your username won't be displayed, ensuring your privacy while sharing sensitive thoughts.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-semibold">Can I delete my posts?</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Yes! You can delete any posts or replies you've created. Simply click the trash icon on your content. Remember, once deleted, it can't be recovered.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-semibold">Why do posts reset every 30 days?</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We believe in keeping conversations current and relevant to your university life. The 30-day reset ensures that content stays fresh and reflects what's happening now on campus.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-semibold">Who can see my posts?</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            All verified students from your university can see posts in your community feed. Only fellow students with verified university emails can access the platform.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-semibold">How do I report inappropriate content?</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Click the flag icon on any post to report it. Our moderation team reviews all reports and takes appropriate action. Community safety is our top priority.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
