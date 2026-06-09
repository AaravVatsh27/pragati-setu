"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useSpring, useMotionValue, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import {
    Sun,
    ShieldCheck,
    Warning,
    Users,
    Wallet
} from "@phosphor-icons/react";

const ScoreNumber = ({ value, delay }: { value: number; delay: number }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        const duration = 2000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            if (elapsed < delay * 1000) {
                requestAnimationFrame(animate);
                return;
            }

            const progress = Math.min((elapsed - delay * 1000) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.floor(easedProgress * value));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [isInView, value, delay]);

    return <span ref={ref}>{displayValue}</span>;
};

const ConfidenceCard = ({
    icon: Icon,
    title,
    score,
    desc,
    colorClass,
    accentColor,
    index,
    total
}: {
    icon: React.ElementType;
    title: string;
    score: number;
    desc: string;
    colorClass: string;
    accentColor: string;
    index: number;
    total: number;
}) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 100, damping: 30 });
    const mouseY = useSpring(y, { stiffness: 100, damping: 30 });
    const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        x.set(px);
        y.set(py);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Arc layout logic
    const mid = Math.floor(total / 2);
    const distFromMid = Math.abs(index - mid);
    const scale = 1 - distFromMid * 0.04;
    const opacity = 1 - distFromMid * 0.1;
    const zIndex = total - distFromMid;
    const yOffset = distFromMid * 30;

    return (
        <Link href="/decision-passport">
            <motion.div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity, y: yOffset }}
                viewport={{ once: true }}
                style={{
                    rotateX,
                    rotateY,
                    scale,
                    zIndex,
                    transformStyle: "preserve-3d"
                }}
                className="glass-card w-[240px] h-[320px] p-8 flex flex-col group cursor-pointer border-white/10"
            >
                <div className={`w-full h-[2px] mb-8 bg-white/05 relative overflow-hidden`}>
                    <motion.div
                        className={`absolute inset-0 ${accentColor} origin-left`}
                        whileHover={{ scaleX: 1, opacity: 1 }}
                        initial={{ scaleX: 0.2, opacity: 0.5 }}
                    />
                </div>

                <div className={`${colorClass} mb-4`}>
                    <Icon size={32} weight="duotone" />
                </div>

                <h4 className="font-sans text-[13px] font-medium text-text-primary mb-6">{title}</h4>

                <div className="flex items-baseline gap-1 mb-4">
                    <span className={`text-[72px] font-display font-bold leading-none ${colorClass}`}>
                        <ScoreNumber value={score} delay={index * 0.15} />
                    </span>
                    <span className="font-mono text-sm text-text-secondary">/100</span>
                </div>

                <p className="font-sans text-xs text-text-secondary leading-relaxed">
                    {desc}
                </p>

                {/* Tilt inner depth effect */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: "radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)",
                        transform: "translateZ(20px)"
                    }}
                />
            </motion.div>
        </Link>
    );
};

const ConfidenceScoresSection: React.FC = () => {
    const scores = [
        {
            icon: Sun,
            title: "Weather Confidence",
            score: 87,
            colorClass: "text-teal-light",
            accentColor: "bg-teal-light",
            desc: "15 years of meteorological data for your exact travel window."
        },
        {
            icon: ShieldCheck,
            title: "Safety Confidence",
            score: 94,
            colorClass: "text-score-high",
            accentColor: "bg-score-high",
            desc: "Real-time jurisdictional risk monitoring and street-level safety indexing."
        },
        {
            icon: Warning,
            title: "Scam Risk Index",
            score: 61,
            colorClass: "text-score-mid",
            accentColor: "bg-score-mid",
            desc: "Behavioral analysis of local transit and mercantile hotspots."
        },
        {
            icon: Users,
            title: "Crowd Analytics",
            score: 78,
            colorClass: "text-teal-light",
            accentColor: "bg-teal-light",
            desc: "Seasonal volume trends and predictive pedestrian density modeling."
        },
        {
            icon: Wallet,
            title: "Budget Stability",
            score: 91,
            colorClass: "text-gold-light",
            accentColor: "bg-gold-light",
            desc: "Forex volatility hedging and localized purchasing power parity."
        },
    ];

    return (
        <section className="relative w-full py-40 bg-[#060A12] overflow-hidden">
            <div className="max-w-[1280px] mx-auto px-6">
                <div className="mb-24 flex flex-col gap-2">
                    {/* FIX: "Sample" label added so users understand these are demo scores,
                        not live scores for their trip. Prevents confusion when scores
                        don't change between sessions. */}
                    <span className="font-mono text-[11px] text-text-secondary tracking-[3px] uppercase block mb-2">
                        Sample · Tokyo, Japan · Mar 2025
                    </span>
                    <h2 className="text-5xl lg:text-6xl font-display font-black text-text-primary leading-[0.9]">
                        Five Scores. <br />
                        <span className="italic text-saffron">One Certain Decision.</span>
                    </h2>
                    <p className="font-sans text-sm text-text-secondary mt-3 max-w-md">
                        Every passport generates five live confidence scores for your exact travel window.
                        These are sample scores — your passport will reflect your destination and dates.
                    </p>
                </div>

                <div className="flex flex-nowrap lg:flex-row items-center justify-center gap-4 lg:gap-8 pb-12 overflow-x-auto lg:overflow-x-visible no-scrollbar">
                    {scores.map((s, i) => (
                        <ConfidenceCard
                            key={i}
                            {...s}
                            index={i}
                            total={scores.length}
                        />
                    ))}
                </div>

                {/* FIX: Added CTA — without this the section is a dead end */}
                <div className="flex justify-center mt-8">
                    <Link href="/register">
                        <motion.button
                            whileHover={{ scale: 1.04, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            className="px-8 py-3.5 bg-saffron hover:bg-saffron-bright text-text-primary font-sans font-semibold rounded-[4px] text-sm shadow-lg shadow-saffron/30 transition-all"
                        >
                            Get your own passport scores →
                        </motion.button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default ConfidenceScoresSection;
