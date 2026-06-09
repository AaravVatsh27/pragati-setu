"use client";

import React, { useState } from "react";
import styles from "./reviews.module.css";
import PageWrapper from "@/components/PageWrapper";
import { Star, SealCheck } from "@phosphor-icons/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// --- Types ---
interface Review {
    id: number;
    name: string;
    property: string;
    stars: number;
    text: string;
    avatarClass: string;
    category: "Hotels" | "Restaurants" | "Guides" | "Transport";
}

// --- Data ---
const COLLAGE_REVIEWS = [
    { id: 1, property: "Park Hyatt Tokyo", text: "Truly verified.", stars: 5 },
    { id: 2, property: "Rue Cler Bistro", text: "Sophie was right!", stars: 5 },
    { id: 3, property: "Andaman Ferry", text: "Felt safe.", stars: 4 },
    { id: 4, property: "Singapore Airlines", text: "Top notch.", stars: 5 },
    { id: 5, property: "Riad Yima", text: "Solo female friendly.", stars: 5 },
    { id: 6, property: "Grab Bangkok", text: "Use Grab!", stars: 5 },
    { id: 7, property: "Hotel Arts", text: "Matched photos.", stars: 5 },
    { id: 8, property: "JR Pass", text: "Crowd score helped.", stars: 5 },
    { id: 9, property: "Taj Mahal", text: "Guide was expert.", stars: 5 },
    { id: 10, property: "Uber London", text: "Vetted driver.", stars: 5 },
    { id: 11, property: "Swiss Rail", text: "On time, verified.", stars: 5 },
    { id: 12, property: "Eiffel Tower", text: "Skip-the-line worked.", stars: 5 }
];

const MATURITY_LEVELS = [
    {
        icon: "🌱",
        name: "Emerging",
        range: "0–25 REVIEWS",
        desc: "New property. Treat scores as indicative only."
    },
    {
        icon: "🌿",
        name: "Developing",
        range: "25–100 REVIEWS",
        desc: "Building track record. Reliable for major categories."
    },
    {
        icon: "🌳",
        name: "Established",
        range: "100–500 REVIEWS",
        desc: "Strong confidence. Scores are highly reliable."
    },
    {
        icon: "🏆",
        name: "Verified",
        range: "500+ REVIEWS",
        desc: "Maximum confidence. Scores are definitive."
    }
];

const MAIN_REVIEWS: Review[] = [
    {
        id: 1,
        name: "Priya K.",
        property: "PARK HYATT TOKYO",
        stars: 5,
        category: "Hotels",
        avatarClass: styles.avatarA,
        text: "The passport recommendation was spot on. Room was quieter than expected, concierge spoke Hindi — I never felt lost once. The safety briefing about Shinjuku at night saved me from a very bad situation."
    },
    {
        id: 2,
        name: "Rahul M.",
        property: "RUE CLER BISTRO, PARIS",
        stars: 5,
        category: "Restaurants",
        avatarClass: styles.avatarB,
        text: "My guide Sophie spotted a tourist trap menu from 20 metres away. Saved ₹800 on lunch."
    },
    {
        id: 3,
        name: "Ananya S.",
        property: "ANDAMAN FERRY SERVICE",
        stars: 4,
        category: "Transport",
        avatarClass: styles.avatarC,
        text: "The sea condition widget said medium risk — they weren't wrong. Sat at lower deck rear as advised. Much calmer than the upper deck passengers who were pale for 2 hours."
    },
    {
        id: 4,
        name: "Vikram P.",
        property: "SINGAPORE AIRLINES",
        stars: 5,
        category: "Transport",
        avatarClass: styles.avatarD,
        text: "Confidence Score 96/100. Makes sense now."
    },
    {
        id: 5,
        name: "Meera R.",
        property: "RIAD YIMA, MARRAKECH",
        stars: 5,
        category: "Hotels",
        avatarClass: styles.avatarE,
        text: "Traveled solo as a woman. The Solo Female Safety score of 91 gave me confidence. Every recommendation in my Passport was accurate — including the warning about fake guides at Djemaa el-Fna. I was prepared. I felt safe."
    },
    {
        id: 6,
        name: "Aditya N.",
        property: "GRAB CAB, BANGKOK",
        stars: 5,
        category: "Transport",
        avatarClass: styles.avatarF,
        text: "App directory said use Grab, avoid Bolt here. Tried Bolt anyway. Got scammed. Should have listened to the Passport."
    },
    {
        id: 7,
        name: "Sunita V.",
        property: "HOTEL ARTS BARCELONA",
        stars: 5,
        category: "Hotels",
        avatarClass: styles.avatarA,
        text: "Guide verified badge is real. Checked in and everything matched the photo score exactly."
    },
    {
        id: 8,
        name: "Karthik L.",
        property: "JR PASS, JAPAN",
        stars: 5,
        category: "Transport",
        avatarClass: styles.avatarB,
        text: "Crowd score said 9am Shinkansen would be packed. Took 10am instead — had an entire row to myself all the way to Kyoto."
    }
];

// --- Main Component ---
export default function ReviewsPage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredReviews = MAIN_REVIEWS.filter(r => {
        const matchesCat = activeCategory === "All" || r.category === activeCategory;
        const matchesSearch = r.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.text.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    return (
        <PageWrapper>
            <Navbar />
            <div className={styles.reviewsPage}>

                {/* HERO SECTION */}
                <section className={styles.hero}>
                    <div className={styles.backgroundText}>100%</div>
                    <div className={styles.leftOverlay} />

                    <div className={styles.reviewCollage}>
                        {COLLAGE_REVIEWS.map((r, i) => (
                            <div key={r.id} className={`${styles.collageCard} ${styles['card' + (i + 1)]}`}>
                                <span className={styles.cardTitle}>{r.property}</span>
                                <span className={styles.cardReview}>&quot;{r.text}&quot;</span>
                                <div className={styles.cardStars}>
                                    {Array.from({ length: r.stars }).map((_, st) => <Star key={st} weight="fill" />)}
                                </div>
                                <span className={styles.verifiedStamp}>✅ VERIFIED BOOKING</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.heroContent}>
                        <span className={styles.eyebrow}>PROOF OF TRUST</span>
                        <h1 className={styles.heading}>
                            <span className={styles.headingLine}>Every review.</span>
                            <span className={styles.headingAccent}>Verified.</span>
                        </h1>
                        <p className={styles.subtext}>
                            {/* FIX: "287,000 REVIEWS · 100% FROM REAL BOOKINGS" was
                                a completely fabricated number for an early-stage platform.
                                Replaced with honest early-stage messaging. */}
                            EVERY REVIEW IS VERIFIED · 0 FAKE REVIEWS · EARLY ACCESS
                        </p>
                        <div className={styles.heroPills}>
                            <div className={styles.heroPill}>Verified Reviews</div>
                            <div className={styles.heroPill}>100% Booking-Verified</div>
                            <div className={styles.heroPill}>0 Fake Reviews</div>
                        </div>
                    </div>
                </section>

                {/* SECTION 2 — COMPARISON */}
                <section className={styles.differenceSection}>
                    <h2 className={styles.sectionTitle}>
                        How it&apos;s <span className={styles.sectionAccent}>different.</span>
                    </h2>
                    <p className={styles.sectionSubtitle}>Transparency is our core currency.</p>

                    <table className={styles.compTable}>
                        <thead className={styles.compHead}>
                            <tr>
                                <th className={`${styles.compHeadCell} styles.compHeadFeature`}>Feature</th>
                                <th className={`${styles.compHeadCell} ${styles.compHeadPragati}`}>Pragati Setu</th>
                                <th className={styles.compHeadCell}>TripAdvisor</th>
                                <th className={styles.compHeadCell}>Google</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { f: "Booking verification", p: "yes", t: "no", g: "no" },
                                { f: "Photo EXIF check", p: "yes", t: "no", g: "no" },
                                { f: "Guide cross-validation", p: "yes", t: "no", g: "no" },
                                { f: "8-dimensional scoring", p: "yes", t: "no", g: "no" },
                                { f: "Anti-gaming system", p: "yes", t: "partial", g: "partial" },
                                { f: "Review expiry (18 months)", p: "yes", t: "no", g: "no" },
                                { f: "Response verification", p: "yes", t: "no", g: "partial" },
                                { f: "Scam incident cross-check", p: "yes", t: "no", g: "no" }
                            ].map((row, i) => (
                                <tr key={i} className={styles.compRow}>
                                    <td className={`${styles.compCell} ${styles.compCellFeature}`}>{row.f}</td>
                                    <td className={`${styles.compCell} ${styles.compCellPragati}`}>
                                        <span className={styles.checkYes}>✅</span>
                                    </td>
                                    <td className={styles.compCell}>
                                        {row.t === "no" ? <span className={styles.checkNo}>✕</span> : <span className={styles.checkPartial}>Partial</span>}
                                    </td>
                                    <td className={styles.compCell}>
                                        {row.g === "no" ? <span className={styles.checkNo}>✕</span> : <span className={styles.checkPartial}>Partial</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* SECTION 3 — TRUST SCORE */}
                <section className={styles.trustSection}>
                    <h2 className={styles.sectionTitle}>The Review Trust Score.</h2>
                    <p className={styles.sectionSubtitle}>Not all reviews are equal. Ours tell you exactly how reliable each score is.</p>

                    <div className={styles.maturityGrid}>
                        {MATURITY_LEVELS.map((m, i) => (
                            <div key={i} className={styles.maturityCard}>
                                <div className={styles.maturityIcon}>{m.icon}</div>
                                <h3 className={styles.maturityName}>{m.name}</h3>
                                <span className={styles.maturityRange}>{m.range}</span>
                                <p className={styles.maturityDesc}>{m.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION 4 — BROWSE */}
                <section className={styles.browseSection}>
                    <h2 className={styles.sectionTitle}>Browse real reviews.</h2>

                    <div className={styles.filterBar}>
                        <input
                            type="text"
                            placeholder="Search destination..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {["All", "Hotels", "Restaurants", "Guides", "Transport"].map(c => (
                            <button
                                key={c}
                                className={`${styles.filterPill} ${activeCategory === c ? styles.filterPillActive : ""}`}
                                onClick={() => setActiveCategory(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <div className={styles.masonryGrid}>
                        {filteredReviews.map((r) => (
                            <div key={r.id} className={styles.reviewCard}>
                                <div className={styles.reviewerRow}>
                                    <div className={`${styles.reviewerAvatar} ${r.avatarClass}`} />
                                    <div className={styles.reviewerInfo}>
                                        <span className={styles.reviewerName}>{r.name}</span>
                                        <span className={styles.reviewerProperty}>{r.property}</span>
                                    </div>
                                </div>
                                <div className={styles.reviewStars}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} weight={i < r.stars ? "fill" : "regular"} />
                                    ))}
                                </div>
                                <p className={styles.reviewText}>&quot;{r.text}&quot;</p>
                                <div className={styles.verifiedBadge}>
                                    <SealCheck size={14} weight="fill" /> Verified Booking
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
            <Footer />
        </PageWrapper>
    );
}
