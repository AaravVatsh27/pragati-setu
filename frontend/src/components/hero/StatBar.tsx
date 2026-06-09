"use client";

import React, { useEffect, useState } from "react";
import type { HomeStat } from "@/lib/home-data";

interface StatItemProps {
    value: number;
    label: string;
    format: HomeStat["format"];
}

const StatCounter: React.FC<StatItemProps> = ({ value, label, format }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        // FIX: Don't animate to zero — it looks like a bug not a feature.
        // Show "—" for zero values until real data exists.
        if (value === 0) return;

        let startTime: number;
        const duration = 2000;
        const delay = 1400;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;

            if (elapsed < delay) {
                requestAnimationFrame(animate);
                return;
            }

            const progress = Math.min((elapsed - delay) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            setCount(easedProgress * value);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    return (
        <div className="flex flex-col items-center sm:items-start">
            <span className="text-2xl font-mono font-bold text-text-primary">
                {value === 0 ? "—" : formatStatValue(count, format)}
            </span>
            <span className="data-label text-[10px] text-text-secondary mt-1">{label}</span>
        </div>
    );
};

const StatBar: React.FC<{ stats: HomeStat[] }> = ({ stats }) => {
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                background: "#060A12",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                zIndex: 30,
                marginTop: "auto",
                paddingTop: "20px",
                paddingBottom: "20px",
            }}
        >
            <div className="max-w-[1280px] mx-auto h-full px-6 flex flex-wrap sm:flex-nowrap items-center justify-around sm:justify-between gap-4">
                {stats.map((stat) => (
                    <StatCounter
                        key={stat.id}
                        value={stat.value}
                        label={stat.label}
                        format={stat.format}
                    />
                ))}
            </div>
        </div>
    );
};

export default StatBar;

function formatStatValue(value: number, format: HomeStat["format"]): string {
    if (format === "currency_inr_compact") {
        const rounded = Math.max(0, value);

        if (rounded >= 100000) {
            return `₹${(rounded / 100000).toFixed(2)}L`;
        }

        if (rounded >= 1000) {
            return `₹${(rounded / 1000).toFixed(1)}K`;
        }

        return `₹${Math.round(rounded).toLocaleString("en-IN")}`;
    }

    return Math.round(Math.max(0, value)).toLocaleString("en-IN");
}
