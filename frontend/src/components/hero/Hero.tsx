"use client";

import React from "react";
import { motion } from "framer-motion";
import ParticleField from "./ParticleField";
import Globe from "./Globe";
import StatBar from "./StatBar";
import { ArrowRight, Compass } from "@phosphor-icons/react";
import Link from "next/link";
import type { HomeHeroCard, HomeHeroCardTone, HomeStat } from "@/lib/home-data";

const FLOATING_CARD_LAYOUTS = [
    {
        position: { top: "-20px", left: "-60px", width: "148px" },
        animation: [0, -10, 0],
        duration: 6,
    },
    {
        position: { top: "10px", right: "-55px", width: "138px" },
        animation: [-6, -16, -6],
        duration: 8,
    },
    {
        position: { bottom: "-10px", left: "-40px", width: "142px" },
        animation: [4, -6, 4],
        duration: 5,
    },
] as const;

const Hero: React.FC<{
    cards: HomeHeroCard[];
    countriesCovered: number;
    stats: HomeStat[];
}> = ({
    cards,
    countriesCovered,
    stats,
}) => {
    // FIX: was "1 covered countries" — wrong grammar and exposes raw DB count
    const countrySummary = countriesCovered === 0
        ? "Live destination coverage, guide signals, and accountable planning."
        : countriesCovered === 1
        ? "1 country covered."
        : `${countriesCovered.toLocaleString("en-IN")} countries covered.`;

    return (
        <section className="relative min-h-screen w-full bg-[#060A12] overflow-hidden flex flex-col justify-between pt-20">
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(212,89,10,0.12)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(11,110,114,0.08)_0%,transparent_70%)] pointer-events-none" />

            <ParticleField />

            <div className="max-w-[1280px] mx-auto w-full px-6 flex flex-col lg:flex-row items-center z-10 py-12 lg:py-0">
                <div className="w-full lg:w-[55%] pt-12 lg:pt-0 lg:pl-20 text-center lg:text-left relative z-20 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="flex items-center justify-center lg:justify-start gap-2 mb-8"
                    >
                        <Compass size={14} weight="fill" className="text-saffron" />
                        <span className="data-label text-[10px] tracking-[3px] text-saffron">
                            GLOBAL TRAVEL INTELLIGENCE PLATFORM
                        </span>
                    </motion.div>

                    <div className="flex flex-col gap-2 mb-10">
                        {["Every Journey.", "Decided With", "Certainty."].map((text, i) => (
                            <motion.h1
                                key={text}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.2, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                                className={`text-[52px] sm:text-[72px] lg:text-[88px] xl:text-[96px] font-display font-black leading-[0.92] tracking-[-2px] lg:tracking-[-3px] ${i === 2 ? "italic text-saffron" : "text-text-primary"
                                    }`}
                            >
                                {text}
                            </motion.h1>
                        ))}
                    </div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0, duration: 0.8 }}
                        className="text-lg sm:text-base font-sans font-light text-text-secondary max-w-[460px] leading-relaxed mb-12 mx-auto lg:mx-0"
                    >
                        The world&apos;s first accountable travel intelligence platform. <br />
                        {countrySummary} 5 confidence signals. 1 accountable guarantee.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="flex flex-wrap items-center justify-center lg:justify-start gap-8"
                    >
                        <Link href="/register">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-9 py-4 bg-saffron hover:bg-saffron-bright text-text-primary font-sans font-semibold rounded-[4px] shadow-xl shadow-saffron/40 transition-all duration-300 flex items-center gap-3"
                            >
                                Create My Decision Passport
                                <ArrowRight size={20} />
                            </motion.button>
                        </Link>

                        {/* "See a Live Demo" removed — it redirected to /decision-passport
                            which immediately bounces unauthenticated users to /login.
                            A demo CTA that hits a login wall is the #1 conversion killer.
                            TODO: replace this with a public sample passport page e.g. /demo */}
                        <Link href="/pricing">
                            <motion.button
                                whileHover={{ color: "#D4590A" }}
                                className="group flex items-center gap-2 text-text-secondary font-sans font-medium hover:text-saffron transition-all text-sm"
                            >
                                See pricing & plans
                                <span className="w-4 h-[1px] bg-current transition-all group-hover:w-6" />
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>

                <div
                    className="hidden lg:flex lg:w-[45%] items-center justify-center"
                    style={{
                        position: "relative",
                        height: "560px",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "420px",
                            height: "420px",
                            flexShrink: 0,
                        }}
                    >
                        <Globe />

                        {cards.map((card, index) => {
                            const layout = FLOATING_CARD_LAYOUTS[index];

                            if (!layout) {
                                return null;
                            }

                            return (
                                <FloatingInsightCard
                                    key={card.id}
                                    animation={[...layout.animation]}
                                    card={card}
                                    duration={layout.duration}
                                    position={layout.position}
                                />
                            );
                        })}

                        {cards.length === 0 ? (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "-10px",
                                    right: "-15px",
                                    zIndex: 30,
                                    width: "220px",
                                }}
                                className="glass-card p-4 border-white/10"
                            >
                                <span className="font-mono text-[10px] tracking-widest text-saffron block mb-2">
                                    LIVE SIGNALS
                                </span>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    Destination insight cards appear here when active passport, guide, or alert coverage is available.
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="block lg:hidden w-full mt-8"
                    style={{ height: "280px", position: "relative" }}
                >
                    <div style={{
                        position: "absolute",
                        top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "260px", height: "260px",
                    }}>
                        <Globe />
                    </div>
                </div>
            </div>

            <StatBar stats={stats} />
        </section>
    );
};

export default Hero;

function FloatingInsightCard({
    animation,
    card,
    duration,
    position,
}: {
    animation: number[];
    card: HomeHeroCard;
    duration: number;
    position: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
        width: string;
    };
}) {
    return (
        <Link
            href={card.href}
            style={{
                position: "absolute",
                zIndex: 30,
                ...position,
            }}
            className="group block"
        >
            <motion.div
                animate={{ y: animation }}
                whileHover={{ scale: 1.04 }}
                transition={{
                    duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="glass-card p-4 border-white/10 hover:border-saffron/40 transition-colors"
            >
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs">{card.flag}</span>
                    <span className="font-mono text-[10px] tracking-widest text-text-secondary">
                        {card.city.toUpperCase()}
                    </span>
                </div>
                <span className={`text-4xl font-display font-bold block ${getToneClass(card.tone)}`}>
                    {card.score}
                </span>
                <span className="font-mono text-[8px] tracking-[2px] text-text-secondary uppercase">
                    {card.label}
                </span>
            </motion.div>
        </Link>
    );
}

function getToneClass(tone: HomeHeroCardTone): string {
    if (tone === "high") {
        return "text-score-high";
    }

    if (tone === "mid") {
        return "text-score-mid";
    }

    return "text-score-low";
}
