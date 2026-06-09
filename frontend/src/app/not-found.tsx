import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Page Not Found",
    description: "This page doesn't exist yet — but your next journey does.",
};

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#060A12] flex items-center justify-center px-6">
            {/* Subtle radial glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(circle,rgba(212,89,10,0.08)_0%,transparent_70%)] pointer-events-none" />

            <div className="relative z-10 text-center max-w-[520px] mx-auto">
                {/* Eyebrow */}
                <span className="font-mono text-[11px] tracking-[4px] text-saffron uppercase block mb-8">
                    404 · Lost in Transit
                </span>

                {/* Heading */}
                <h1 className="font-display font-black text-text-primary leading-[0.9] mb-6"
                    style={{ fontSize: "clamp(64px, 10vw, 96px)" }}>
                    This page
                    <br />
                    <span className="italic text-saffron">doesn&apos;t exist.</span>
                </h1>

                <p className="font-sans text-base text-text-secondary leading-relaxed mb-12 max-w-[380px] mx-auto">
                    The route you followed isn&apos;t live yet — or it may have moved.
                    Head back and plan your next certain journey.
                </p>

                {/* Navigation options */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/">
                        <button className="px-8 py-3.5 bg-saffron hover:bg-saffron-bright text-text-primary font-sans font-semibold rounded-[4px] text-sm transition-all shadow-lg shadow-saffron/30">
                            Back to Home
                        </button>
                    </Link>
                    <Link href="/pricing">
                        <button className="px-8 py-3.5 glass-card border-white/10 hover:border-saffron/30 text-text-secondary hover:text-text-primary font-sans font-medium rounded-[4px] text-sm transition-all">
                            See Pricing
                        </button>
                    </Link>
                    <Link href="/guides">
                        <button className="px-8 py-3.5 glass-card border-white/10 hover:border-saffron/30 text-text-secondary hover:text-text-primary font-sans font-medium rounded-[4px] text-sm transition-all">
                            Find a Guide
                        </button>
                    </Link>
                </div>

                {/* Bottom divider */}
                <div className="mt-16 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <p className="font-mono text-[10px] text-text-secondary/40 mt-4 tracking-widest">
                    PRAGATI SETU · EVERY JOURNEY. DECIDED WITH CERTAINTY.
                </p>
            </div>
        </div>
    );
}
