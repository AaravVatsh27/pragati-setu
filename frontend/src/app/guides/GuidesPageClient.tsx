"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./guides.module.css";
import {
    ArrowRight,
    ChatText,
    Star,
    UsersThree,
    VideoCamera,
} from "@phosphor-icons/react";

export interface GuideCardData {
    id: string;
    name: string;
    city: string;
    country: string;
    cityLabel: string;
    cityKey: string;
    flag: string;
    avatarUrl: string | null;
    avatarClass: string;
    availability: string;
    availabilityStatus: "online" | "away";
    languages: string[];
    specialties: string[];
    fieldReport: string;
    rating: number;
    reviews: number;
    sessionModes: string[];
}

export interface GuideCityFilter {
    label: string;
    flag: string;
}

export interface GuideStat {
    value: string;
    label: string;
}

export interface GuideHeroPreview {
    id: string;
    flag: string;
    name: string;
    city: string;
}

export interface GuidePricingTier {
    name: string;
    price: number;
    unit: string;
    description: string;
    bestFor: string;
    icon: "chat" | "video" | "inperson";
    featured: boolean;
}

const VERIFICATION_STEPS = [
    "Identity verification with government ID",
    "Local knowledge test (city-specific quiz)",
    "Language fluency assessment",
    "Video interview with our team",
    "Community reputation check",
    "Trial session with internal reviewer",
    "Ongoing rating monitoring (min 4.2★)",
];

export default function GuidesPageClient({
    cityFilters,
    guides,
    headingLead,
    heroPreviewGuides,
    heroStats,
    pricingTiers,
}: {
    cityFilters: GuideCityFilter[];
    guides: GuideCardData[];
    headingLead: string;
    heroPreviewGuides: GuideHeroPreview[];
    heroStats: GuideStat[];
    pricingTiers: GuidePricingTier[];
}) {
    const [activeCity, setActiveCity] = useState("All");
    const discoveryRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.visible);
                    }
                });
            },
            { threshold: 0.12 }
        );

        const elements = document.querySelectorAll("[data-fade-up]");
        elements.forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, []);

    const filteredGuides =
        activeCity === "All"
            ? guides
            : guides.filter(
                (guide) => guide.city.toLowerCase() === activeCity.toLowerCase()
            );

    const handleFindGuide = () => {
        discoveryRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    const handleGuideApplication = () => {
        const subject = encodeURIComponent("Guide Application - Pragati Setu");
        const body = encodeURIComponent(
            [
                "I'd like to apply as a Pragati Setu local guide.",
                "",
                "Name:",
                "City:",
                "Languages:",
                "Specialties:",
            ].join("\n")
        );

        window.location.href = `mailto:sales@pragatisetu.com?subject=${subject}&body=${body}`;
    };

    const handleBookSession = (guide: GuideCardData) => {
        const subject = encodeURIComponent(
            `Guide Session Request - ${guide.name} (${guide.cityLabel})`
        );
        const body = encodeURIComponent(
            [
                `I want to book a guide session with ${guide.name}.`,
                "",
                `City: ${guide.cityLabel}`,
                `Available modes: ${guide.sessionModes.join(", ")}`,
                "",
                "Preferred format:",
                "Preferred dates:",
                "Trip context:",
            ].join("\n")
        );

        window.location.href = `mailto:sales@pragatisetu.com?subject=${subject}&body=${body}`;
    };

    return (
        <div className={styles.guidesPage}>
            <section className={styles.hero}>
                <div className={styles.warmGlow} />
                <div className={styles.goldGlow} />
                <div className={styles.tealGlow} />

                <div className={styles.heroLeft}>
                    <span className={styles.eyebrow}>LOCAL INTELLIGENCE</span>
                    <h1 className={styles.heading}>
                        <span className={styles.headingLine1}>{headingLead}</span>
                        <span className={styles.headingLine2}>Your language.</span>
                        <span className={styles.headingLine3}>On demand.</span>
                    </h1>
                    <p className={styles.subtext}>
                        Every city. Every question. From someone who actually lives there.
                    </p>

                    <div className={styles.statsRow}>
                        {heroStats.map((stat) => (
                            <div key={stat.label} className={styles.statPill}>
                                <span className={styles.statNum}>{stat.value}</span>
                                <span className={styles.statLabel}>{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.ctaRow}>
                        <button
                            className={styles.btnPrimary}
                            onClick={handleFindGuide}
                            type="button"
                        >
                            Find a Guide <ArrowRight size={16} />
                        </button>
                        <button
                            className={styles.btnGhost}
                            onClick={handleGuideApplication}
                            type="button"
                        >
                            Become a Guide
                        </button>
                    </div>
                </div>

                <div className={styles.heroRight}>
                    {heroPreviewGuides.map((guide, index) => (
                        <div
                            className={`${styles.guideCircle} ${styles[`circle${index + 1}`]}`}
                            key={guide.id}
                        >
                            <div className={styles.guideInfo}>
                                <span className={styles.guideNameSmall}>
                                    {guide.flag} {guide.name}
                                </span>
                                <span className={styles.guideCitySmall}>{guide.city}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section
                className={styles.discoverySection}
                id="guide-directory"
                ref={discoveryRef}
            >
                <div className={`${styles.sectionHeader} ${styles.fadeUp}`} data-fade-up>
                    <h2 className={styles.sectionTitle}>
                        Meet the <span className={styles.sectionAccent}>Pioneers.</span>
                    </h2>
                </div>

                <div className={`${styles.cityFilters} ${styles.fadeUp}`} data-fade-up>
                    {cityFilters.map((city) => (
                        <button
                            className={`${styles.cityPill} ${activeCity === city.label ? styles.cityPillActive : ""}`}
                            key={city.label}
                            onClick={() => setActiveCity(city.label)}
                            type="button"
                        >
                            <span>{city.flag}</span> {city.label}
                        </button>
                    ))}
                </div>

                <div className={styles.guidesGrid}>
                    {filteredGuides.length === 0 ? (
                        <div className={`${styles.guideCard} ${styles.emptyStateCard}`}>
                            <h3 className={styles.guideName}>No guides available yet</h3>
                            <p className={styles.fieldReportText}>
                                We&apos;re onboarding verified locals for this city. Try another destination or apply to join the network.
                            </p>
                        </div>
                    ) : (
                        filteredGuides.map((guide) => (
                            <div
                                className={`${styles.guideCard} ${styles.fadeUp}`}
                                data-fade-up
                                key={guide.id}
                            >
                                <div className={styles.cardTop}>
                                    <div className={styles.avatarWrapper}>
                                        <div className={`${styles.avatar} ${styles[guide.avatarClass]}`}>
                                            {guide.avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    alt={guide.name}
                                                    className={styles.avatarImage}
                                                    src={guide.avatarUrl}
                                                />
                                            ) : (
                                                <span className={styles.avatarFallback}>
                                                    {getInitials(guide.name)}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.flagBadge}>{guide.flag}</div>
                                    </div>
                                    <div className={styles.availabilityDot}>
                                        <div
                                            className={
                                                guide.availabilityStatus === "online"
                                                    ? styles.dotGreen
                                                    : styles.dotAmber
                                            }
                                        />
                                        {guide.availability}
                                    </div>
                                </div>

                                <h3 className={styles.guideName}>{guide.name}</h3>
                                <p className={styles.guideCity}>
                                    {guide.city.toUpperCase()}
                                    {guide.country && `, ${guide.country.toUpperCase()}`}
                                </p>

                                <div className={styles.languagePills}>
                                    {guide.languages.map((language) => (
                                        <span className={styles.languagePill} key={language}>
                                            {getLanguageFlag(language)} {language}
                                        </span>
                                    ))}
                                </div>

                                <div className={styles.specialtyTags}>
                                    {guide.specialties.map((specialty) => (
                                        <span className={styles.tag} key={specialty}>
                                            {specialty}
                                        </span>
                                    ))}
                                </div>

                                <div className={styles.fieldReport}>
                                    <span className={styles.fieldReportLabel}>Live Intel</span>
                                    <p className={styles.fieldReportText}>
                                        &quot;{guide.fieldReport}&quot;
                                    </p>
                                </div>

                                <div className={styles.ratingRow}>
                                    <div className={styles.stars}>
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <Star
                                                key={index}
                                                size={13}
                                                weight={
                                                    index < Math.round(guide.rating)
                                                        ? "fill"
                                                        : "regular"
                                                }
                                            />
                                        ))}
                                    </div>
                                    <span className={styles.reviewCount}>
                                        {guide.reviews} REVIEWS
                                    </span>
                                </div>

                                <div className={styles.tierPills}>
                                    {guide.sessionModes.map((mode) => (
                                        <div className={styles.tierPill} key={mode}>
                                            {mode}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className={styles.bookBtn}
                                    onClick={() => handleBookSession(guide)}
                                    type="button"
                                >
                                    Book a Session
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className={styles.tiersSection}>
                <div className={styles.fadeUp} data-fade-up>
                    <h2 className={styles.tiersTitle}>How it works.</h2>
                    <p className={styles.tiersSubtitle}>
                        Choose the depth of intelligence you need.
                    </p>
                </div>

                <div className={styles.tiersGrid}>
                    {pricingTiers.map((tier) => (
                        <div
                            className={`${styles.tierCard} ${tier.featured ? styles.tierCardFeatured : ""} ${styles.fadeUp}`}
                            data-fade-up
                            key={tier.name}
                        >
                            {renderTierIcon(tier.icon)}
                            <h3 className={styles.tierName}>{tier.name}</h3>
                            <p className={styles.tierDesc}>{tier.description}</p>
                            <div className={styles.tierPrice}>
                                ₹{tier.price.toLocaleString("en-IN")}{" "}
                                <span className={styles.tierPriceUnit}>{tier.unit}</span>
                            </div>
                            <p className={styles.tierBestFor}>{tier.bestFor}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.verifySection}>
                <div className={styles.fadeUp} data-fade-up>
                    <h2 className={styles.verifyTitle}>
                        Every guide.
                        <br />
                        <span className={styles.verifyTitleSpan}>Background verified.</span>
                        <br />
                        Guarantee backed.
                    </h2>
                    <p className={styles.verifySubtext}>
                        Every guide completes a 7-step verification before their first session. We check identity, local knowledge, language fluency, and community reputation. If a guide gives bad advice that causes harm — we compensate you.
                    </p>
                </div>

                <div className={styles.verifySteps}>
                    {VERIFICATION_STEPS.map((step, index) => (
                        <div
                            className={`${styles.verifyStep} ${styles.fadeUp}`}
                            data-fade-up
                            key={step}
                        >
                            <span className={styles.stepNum}>
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <p className={styles.stepText}>{step}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className={`${styles.becomeSection} ${styles.fadeUp}`} data-fade-up>
                <div className={styles.becomeLeft}>
                    <h2 className={styles.becomeTitle}>
                        Live in a great city?{" "}
                        <span className={styles.becomeTitleAccent}>Share it.</span>
                    </h2>
                    <p className={styles.becomeDesc}>
                        Set your own rates per session. Help Indian travelers experience your city like a local. Flexible hours. Your rules.
                    </p>
                </div>
                <div className={styles.becomeRight}>
                    <div className={styles.earnStat}>
                        <div className={styles.earnNum}>₹299+</div>
                        <div className={styles.earnLabel}>PER SESSION, YOU SET THE RATE</div>
                    </div>
                    <button
                        className={styles.btnPrimary}
                        onClick={handleGuideApplication}
                        type="button"
                    >
                        Apply as a Guide <ArrowRight size={16} />
                    </button>
                </div>
            </section>
        </div>
    );
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

function getLanguageFlag(language: string): string {
    const flags: Record<string, string> = {
        hindi: "🇮🇳",
        tamil: "🇮🇳",
        malayalam: "🇮🇳",
        gujarati: "🇮🇳",
        japanese: "🇯🇵",
        french: "🇫🇷",
        english: "🇬🇧",
    };

    return flags[language.toLowerCase()] ?? "🌐";
}

function renderTierIcon(icon: GuidePricingTier["icon"]) {
    if (icon === "chat") {
        return <ChatText className={styles.tierIcon} />;
    }

    if (icon === "video") {
        return <VideoCamera className={styles.tierIcon} />;
    }

    return <UsersThree className={styles.tierIcon} />;
}
