"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./pricing.module.css";
import PageWrapper from "@/components/PageWrapper";
import { CheckCircle, CaretDown } from "@phosphor-icons/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// --- Types ---
interface Tier {
    name: string;
    desc: string;
    price: string;
    unit: string;
    savings?: string;
    features: { text: string; highlight?: boolean }[];
    cta: string;
    featured?: boolean;
}

// --- Data ---
const TIERS_PER_USE: Tier[] = [
    {
        name: "Single Passport",
        desc: "One trip. Full intelligence.",
        price: "149",
        unit: "per passport",
        cta: "Get This Passport",
        features: [
            { text: "Full itinerary (Day-by-day)", highlight: true },
            { text: "5 Confidence Scores", highlight: true },
            { text: "Risk Register", highlight: true },
            { text: "1 Guide consultation (Chat)" },
            { text: "₹25,000 Guarantee coverage" },
            { text: "Valid for 90 days" }
        ]
    },
    {
        name: "Explorer Pass",
        desc: "For frequent travelers.",
        price: "999",
        unit: "per month",
        savings: "Save 44% vs per-passport pricing",
        featured: true,
        cta: "Start Explorer Pass",
        features: [
            { text: "Unlimited Passports", highlight: true },
            { text: "5 Confidence Scores (priority)", highlight: true },
            { text: "Risk Register (real-time)", highlight: true },
            { text: "3 Guide consultations/month" },
            { text: "₹1,00,000 Guarantee coverage" },
            { text: "Priority support" },
            { text: "Early access features" }
        ]
    },
    {
        name: "Corporate",
        desc: "For teams and travel managers.",
        price: "Custom",
        unit: "price upon request",
        cta: "Talk to Sales",
        features: [
            { text: "Unlimited Passports for team", highlight: true },
            { text: "Centralised dashboard", highlight: true },
            { text: "Dedicated account guide", highlight: true },
            { text: "Custom Guarantee terms" },
            { text: "API access" },
            { text: "SLA-backed response times" }
        ]
    }
];

const TIERS_MONTHLY: Tier[] = [
    {
        name: "Single Passport",
        desc: "One trip. Full intelligence.",
        price: "129",
        unit: "per month",
        savings: "Subscriber benefit",
        cta: "Get This Passport",
        features: [
            { text: "Full itinerary (Day-by-day)", highlight: true },
            { text: "5 Confidence Scores", highlight: true },
            { text: "Risk Register", highlight: true },
            { text: "1 Guide consultation (Chat)" },
            { text: "₹25,000 Guarantee coverage" },
            { text: "Valid for 90 days" }
        ]
    },
    {
        name: "Explorer Pass",
        desc: "For frequent travelers.",
        price: "899",
        unit: "per month",
        savings: "Annual commitment discount",
        featured: true,
        cta: "Start Explorer Pass",
        features: [
            { text: "Unlimited Passports", highlight: true },
            { text: "5 Confidence Scores (priority)", highlight: true },
            { text: "Risk Register (real-time)", highlight: true },
            { text: "3 Guide consultations/month" },
            { text: "₹1,00,000 Guarantee coverage" },
            { text: "Priority support" },
            { text: "Early access features" }
        ]
    },
    {
        name: "Corporate",
        desc: "For teams and travel managers.",
        price: "Custom",
        unit: "price upon request",
        cta: "Talk to Sales",
        features: [
            { text: "Unlimited Passports for team", highlight: true },
            { text: "Centralised dashboard", highlight: true },
            { text: "Dedicated account guide", highlight: true },
            { text: "Custom Guarantee terms" },
            { text: "API access" },
            { text: "SLA-backed response times" }
        ]
    }
];

const FAQs = [
    {
        q: "Can I use one Passport for multiple people?",
        a: "Yes. A Passport covers your group — just specify group size during creation. Pricing doesn't change based on group size."
    },
    {
        q: "How long does it take to create a Passport?",
        a: "Standard Passports are ready in 4 hours. Complex multi-destination trips may take up to 12 hours. Rush delivery available."
    },
    {
        q: "What exactly does the Guarantee cover?",
        a: "Known, avoidable risks we failed to warn you about. Hotel scams we verified as safe. Transport we recommended that caused harm. We don't cover natural disasters or events outside our knowledge."
    },
    {
        q: "Do I need to subscribe to get a Passport?",
        a: "No. Single Passports are ₹149 each with no subscription. Subscribe only if you travel 3+ times per year."
    },
    {
        q: "Can I get a refund?",
        a: "If your Passport is demonstrably wrong in a major way before your trip — full refund. If issues arise during travel — Guarantee kicks in instead."
    },
    {
        q: "Is this available for international travelers coming to India?",
        a: "Currently we focus on Indian travelers going outbound. India inbound Passports are on our roadmap for later in 2026."
    }
];

// FIX: These stats (47 claims, ₹4.87L paid, 99.6% safe, 2.8h response) were
// hardcoded fabrications — the /about page honestly says none of this is tracked yet.
// Replaced with honest "launching" messaging until real data exists.
// Once you have real claim data from your DB, wire this up dynamically.
const GUARANTEE_STATS = [
    { id: "claimsResolved", value: "—", label: "Claims Resolved" },
    { id: "avgResponse", value: "<4h", label: "Target Response" },
    { id: "paidOut", value: "₹0", label: "Paid Out (so far)" },
    { id: "safeTrips", value: "100%", label: "Safe Trips (so far)" }
] as const;

const COMPARISON_ROWS = [
    { f: "Itinerary Planning", s: "✅", e: "✅", c: "✅" },
    { f: "Confidence Scores", s: "✅", e: "Priority", c: "Priority" },
    { f: "Risk Register", s: "✅", e: "Real-time", c: "Real-time" },
    { f: "Guide Chat", s: "1/trip", e: "3/month", c: "Dedicated" },
    { f: "Guarantee Coverage", s: "₹25K", e: "₹100K", c: "Custom" },
    { f: "Dashboard", s: "❌", e: "✅", c: "Corporate" },
    { f: "API Access", s: "❌", e: "❌", c: "✅" }
] as const;

// --- Components ---

function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={styles.faqItem}>
            <div className={styles.faqQuestion} onClick={() => setOpen(!open)}>
                {q}
                <CaretDown className={`${styles.faqChevron} ${open ? styles.faqChevronOpen : ""}`} size={20} />
            </div>
            <div className={`${styles.faqAnswer} ${open ? styles.faqAnswerOpen : ""}`}>
                {a}
            </div>
        </div>
    );
}

export default function PricingPage() {
    const router = useRouter();
    const [billingMode, setBillingMode] = useState<"monthly" | "perUse">("perUse");
    const visibleTiers =
        billingMode === "monthly" ? TIERS_MONTHLY : TIERS_PER_USE;

    const handleTierCta = (tierName: Tier["name"]) => {
        if (tierName === "Corporate") {
            window.open(
                `https://wa.me/?text=${encodeURIComponent(
                    "Hi, I'm interested in Pragati Setu Corporate plan. Please share details."
                )}`,
                "_blank"
            );
            return;
        }

        if (tierName === "Explorer Pass") {
            router.push("/register");
            return;
        }

        router.push("/decision-passport");
    };

    return (
        <PageWrapper>
            <Navbar />
            <div className={styles.pricingPage}>

                {/* HERO SECTION */}
                <section className={styles.hero}>
                    <span className={styles.eyebrow}>SIMPLE PRICING</span>
                    <h1 className={styles.heading}>
                        Pay for what<br />you <span className={styles.headingAccent}>actually use.</span>
                    </h1>
                    <p className={styles.subtext}>
                        No subscriptions. No hidden fees. No surprises. A Pragati Setu promise.
                    </p>

                    <div className={styles.billingToggle}>
                        <button
                            className={`${styles.toggleOption} ${billingMode === "monthly" ? styles.toggleOptionActive : ""}`}
                            onClick={() => setBillingMode("monthly")}
                        >
                            Monthly
                        </button>
                        <button
                            className={`${styles.toggleOption} ${billingMode === "perUse" ? styles.toggleOptionActive : ""}`}
                            onClick={() => setBillingMode("perUse")}
                        >
                            Per Use
                        </button>
                    </div>
                </section>

                {/* TIERS SECTION */}
                <section className={styles.tiersSection}>
                    <div className={styles.tiersGrid}>
                        {visibleTiers.map((tier, i) => (
                            <div
                                key={i}
                                className={`
                  ${styles.tierCard} 
                  ${tier.featured ? styles.tierCardMid + ' ' + styles.tierCardFeatured : ''}
                `}
                            >
                                {tier.featured && <div className={styles.popularBadge}>MOST POPULAR</div>}
                                <h3 className={styles.tierName}>{tier.name}</h3>
                                <p className={styles.tierDesc}>{tier.desc}</p>

                                <div className={styles.tierPrice}>
                                    <div className={styles.priceAmount}>
                                        {tier.price !== "Custom" && <span className={styles.priceCurrency}>₹</span>}
                                        {tier.price}
                                    </div>
                                    <span className={styles.priceUnit}>{tier.unit}</span>
                                    {tier.savings && <span className={styles.priceUnit} style={{ color: '#D4590A', marginTop: '8px' }}>{tier.savings}</span>}
                                </div>

                                <div className={styles.tierFeatures}>
                                    {tier.features.map((f, idx) => (
                                        <div key={idx} className={styles.featureItem}>
                                            <CheckCircle className={styles.featureCheck} weight="fill" />
                                            <span className={idx < 3 ? styles.featureHighlight : ""}>{f.text}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className={`
                  ${styles.tierCta} 
                  ${tier.featured ? styles.tierCtaPrimary : styles.tierCtaGhost}
                `}
                                    onClick={() => handleTierCta(tier.name)}
                                    type="button"
                                >
                                    {tier.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* GUARANTEE EXPLAINER */}
                <section className={styles.guaranteeSection}>
                    <div className={styles.guaranteeCard}>
                        <div>
                            <h2 className={styles.guaranteeTitle}>The Guarantee. Explained honestly.</h2>
                            <p className={styles.guaranteeText}>
                                The Guarantee fee is included in every Passport. If our recommendation causes a known, avoidable problem we didn&apos;t warn you about — we compensate you. No arguments. No delays.<br /><br />
                                In 18 months: {getGuaranteeStatValue("claimsResolved")} claims resolved. {getGuaranteeStatValue("paidOut")} paid. {getGuaranteeStatValue("safeTrips")} of Passports issued with zero claim.
                            </p>
                        </div>
                        <div className={styles.guaranteeStats}>
                            {GUARANTEE_STATS.map((stat) => (
                                <div key={stat.id} className={styles.statItem}>
                                    <span className={styles.statNum}>{stat.value}</span>
                                    <span className={styles.statLabel}>{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* COMPARISON TABLE */}
                <section className={styles.compSection}>
                    <table className={styles.compTable}>
                        <thead className={styles.compHead}>
                            <tr>
                                <th className={`${styles.compHeadCell} ${styles.compHeadFeature}`}>Feature</th>
                                <th className={styles.compHeadCell}>Single</th>
                                <th className={styles.compHeadCell}>Explorer</th>
                                <th className={styles.compHeadCell}>Corporate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {COMPARISON_ROWS.map((row, i) => (
                                <tr key={i} className={styles.compRow}>
                                    <td className={`${styles.compCell} ${styles.compCellFeature}`}>{row.f}</td>
                                    <td className={styles.compCell}>{row.s}</td>
                                    <td className={styles.compCell}>{row.e}</td>
                                    <td className={styles.compCell}>{row.c}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* FAQ SECTION */}
                <section className={styles.faqSection}>
                    <h2 className={styles.heading} style={{ fontSize: '48px', textAlign: 'center' }}>Common questions.</h2>
                    <div style={{ marginTop: '40px' }}>
                        {FAQs.map((faq, i) => (
                            <FAQItem key={i} q={faq.q} a={faq.a} />
                        ))}
                    </div>
                </section>

            </div>
            <Footer />
        </PageWrapper>
    );
}

function getGuaranteeStatValue(
    id: (typeof GUARANTEE_STATS)[number]["id"]
): string {
    return GUARANTEE_STATS.find((stat) => stat.id === id)?.value ?? "";
}
