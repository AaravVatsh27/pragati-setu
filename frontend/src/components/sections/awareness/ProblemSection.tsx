"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

const Word = ({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) => {
    const opacity = useTransform(progress, range, [0.2, 1]);
    return (
        <span className="relative mr-3 inline-block lg:mr-5">
            <motion.span style={{ opacity }}>{children}</motion.span>
        </span>
    );
};

const RevealLine = ({ text, progress, start, end, className = "" }: { text: string; progress: MotionValue<number>; start: number; end: number; className?: string }) => {
    const words = text.split(" ");
    const step = (end - start) / words.length;

    return (
        <h2 className={`font-display font-black leading-tight tracking-tight ${className}`}>
            {words.map((word, i) => {
                const s = start + i * step;
                const e = s + step;
                return (
                    <Word key={i} progress={progress} range={[s, e]}>
                        {word}
                    </Word>
                );
            })}
        </h2>
    );
};

const ProblemSection: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 0.8", "end 0.2"],
    });

    return (
        <section
            ref={containerRef}
            className="relative w-full bg-[#060A12] py-[120px] px-6 lg:px-20 overflow-hidden"
        >
            <div className="max-w-[1280px] mx-auto flex flex-col gap-4">
                <RevealLine
                    text="Every platform shows you options."
                    progress={scrollYProgress}
                    start={0}
                    end={0.25}
                    className="text-[48px] lg:text-[64px] text-text-primary"
                />
                <RevealLine
                    text="Nobody tells you why."
                    progress={scrollYProgress}
                    start={0.25}
                    end={0.5}
                    className="text-[48px] lg:text-[64px] text-text-primary"
                />
                <RevealLine
                    text="Nobody stands behind their answer."
                    progress={scrollYProgress}
                    start={0.5}
                    end={0.75}
                    className="text-[48px] lg:text-[64px] text-text-primary"
                />
                <RevealLine
                    text="Until now."
                    progress={scrollYProgress}
                    start={0.75}
                    end={1.0}
                    className="text-[56px] lg:text-[72px] italic text-saffron"
                />
            </div>

            {/* Gradient divider */}
            <div className="mt-32 w-full h-[1px] bg-gradient-to-r from-transparent via-saffron to-transparent opacity-30" />
        </section>
    );
};

export default ProblemSection;
