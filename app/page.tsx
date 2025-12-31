import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-background px-4">
      <div className="container max-w-4xl text-center space-y-8 animate-in fade-in zoom-in duration-700">

        <div className="flex justify-center mb-6">
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/android/android-launchericon-192-192.png"
              alt="DropLet Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground">
          Find your vibe.
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
          Simple. Calm. Low Effort.<br />
          Connect with your university community without the noise.
        </p>

        <div className="pt-8">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground text-lg font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Join Chat <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

      </div>
    </div>
  )
}
