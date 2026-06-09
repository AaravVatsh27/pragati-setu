"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";

const FinalCTASection: React.FC = () => (
    <section className="relative w-full min-h-screen flex items-center justify-center bg-saffron overflow-hidden">
        {/* Animated grain overlay */}
        <motion.div
            animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundSize: "256px 256px",
            }}
        />

        {/* Devanagari watermark — bottom-anchored, small enough never to hit the heading */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none overflow-hidden select-none z-0">
            <span
                className="font-display font-black text-white/[0.03] text-center leading-tight translate-y-1/2"
                style={{ fontSize: "clamp(100px, 20vw, 300px)", letterSpacing: "0.08em", whiteSpace: "nowrap" }}
            >
                प्रगति सेतु
            </span>
        </div>

        {/* Radial glow */}
        <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-[760px] mx-auto flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            >
                <h2 className="font-display font-black text-white leading-[0.92] tracking-tight mb-8"
                    style={{ fontSize: "clamp(52px, 7vw, 80px)" }}>
                    Your next journey
                    <br />
                    deserves certainty.
                </h2>
            </motion.div>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="font-sans text-lg text-white/80 mb-12 max-w-[460px] leading-relaxed"
            >
                {/* FIX: "Join 12,847 travelers" was a hardcoded fake number —
                    completely inconsistent with the rest of the site showing 1 guide,
                    1 passport. Replaced with honest value proposition copy. */}
                Stop guessing. Start traveling with five verified signals behind every decision.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, duration: 0.8 }}
                className="flex flex-col items-center gap-5"
            >
                {/* FIX: was onClick={() => window.location.href = '/register'}
                    — hard navigation breaks Next.js client-side routing.
                    Use Link wrapper instead. */}
                <Link href="/register">
                    <motion.button
                        whileHover={{
                            y: -3,
                            boxShadow: "0 4px 0 rgba(0,0,0,0.18), 0 12px 32px rgba(0,0,0,0.30), 0 28px 60px rgba(0,0,0,0.22)",
                        }}
                        whileTap={{ y: 0, boxShadow: "0 2px 0 rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.20)" }}
                        className="flex items-center gap-3 bg-white text-saffron font-sans font-bold text-base px-14 py-5 rounded-[4px] transition-all group"
                        style={{
                            boxShadow: "0 2px 0 rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.22), 0 20px 48px rgba(0,0,0,0.16)",
                        }}
                    >
                        Create My Decision Passport
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </Link>

                <div className="flex flex-col items-center gap-2">
                    <span className="font-mono text-[11px] text-white/60 tracking-[1px]">
                        ₹149 to start. Cancel anytime.
                    </span>
                    <Link href="/pricing" className="text-[11px] font-sans text-white/40 hover:text-white transition-colors underline underline-offset-4">
                        View all plans & features
                    </Link>
                </div>
            </motion.div>
        </div>

        {/* Subtle top border gradient */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </section>
);

export default FinalCTASection;
