import Link from "next/link";
import type { Metadata } from "next";
import styles from "./about.module.css";
import PageWrapper from "@/components/PageWrapper";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
    title: "About Us",
    description: "We build accountable travel intelligence for Indian travelers. Here's what we believe, what we've built, and what we're working toward.",
};
import { queryOne } from "@/lib/db";

interface AboutSnapshotRow {
    active_passports: number;
    active_guides: number;
    active_alerts: number;
    published_briefs: number;
    newsletter_subscribers: number;
}

interface PublishedBriefRow {
    title: string;
    slug: string;
    author: string;
    published_at: string | null;
    created_at: string;
}

const PLATFORM_AREAS = [
    {
        title: "Signal Layer",
        role: "LIVE DATA",
        summary:
            "Safety alerts, destination demand, and editorial briefs are surfaced from current tables rather than padded with fake coverage.",
        avatarClass: styles.avatarA,
        avatarLabel: "S",
    },
    {
        title: "Guide Coverage",
        role: "LOCAL CONTEXT",
        summary:
            "Guide records, verification state, and destination coverage stay visible so users can see where human support actually exists.",
        avatarClass: styles.avatarB,
        avatarLabel: "G",
    },
    {
        title: "Decision Passport",
        role: "TRIP SYSTEM",
        summary:
            "Passport generation ties together alerts, bookings, preferences, and destination context into one trackable planning flow.",
        avatarClass: styles.avatarC,
        avatarLabel: "P",
    },
    {
        title: "Transparency",
        role: "PUBLIC REPORTING",
        summary:
            "This page now reflects current platform counts and published briefs. If a metric is not tracked, it is not invented here.",
        avatarClass: styles.avatarD,
        avatarLabel: "T",
    },
] as const;

const VALUES = [
    {
        title: "Evidence First",
        text: "We would rather show a thin but accurate surface than inflate credibility with fictional history, fictional people, or invented performance metrics.",
    },
    {
        title: "Operational Honesty",
        text: "If a table does not exist yet, the page says so. Claims, payouts, and guarantee outcomes will only appear once they are actually being logged.",
    },
    {
        title: "Built Around Indian Travel",
        text: "The product is designed for the real friction Indian travelers deal with abroad: uncertainty, timing gaps, local context, and avoidable mistakes.",
    },
] as const;

export const revalidate = 300;

export default async function AboutUsPage() {
    const [snapshot, latestBrief] = await Promise.all([
        getAboutSnapshot(),
        getLatestPublishedBrief(),
    ]);

    const snapshotCards = [
        {
            value: formatCount(snapshot.active_passports),
            label: "ACTIVE PASSPORTS",
        },
        {
            value: formatCount(snapshot.active_guides),
            label: "LIVE GUIDE PROFILES",
        },
        {
            value: formatCount(snapshot.active_alerts),
            label: "ACTIVE ALERTS",
        },
        {
            value: formatCount(snapshot.published_briefs),
            label: "PUBLISHED BRIEFS",
        },
    ];

    const briefHref = latestBrief
        ? `/blog/${latestBrief.slug}`
        : "/blog";
    const briefLabel = latestBrief
        ? "Open Latest Brief"
        : "Open Intelligence Feed";
    const briefMeta = latestBrief
        ? `${latestBrief.title} | ${latestBrief.author} | ${formatPublishedDate(latestBrief.published_at ?? latestBrief.created_at)}`
        : "No published brief yet. The intelligence feed remains the current public record.";

    return (
        <PageWrapper>
            <Navbar />
            <div className={styles.aboutPage}>
                <section className={styles.hero}>
                    <div className={styles.heroGlow} />
                    <div className={styles.heroContent}>
                        <span className={styles.eyebrow}>WHY WE EXIST</span>
                        <h1 className={styles.heading}>
                            Travel intelligence should be auditable.
                            <span className={styles.headingAccent}>Not theatrical.</span>
                        </h1>
                        <p className={styles.storyText}>
                            Pragati Setu exists to reduce uncertainty for Indian travelers abroad with visible signals, local context, and trip-specific planning tools.
                            <br />
                            <br />
                            This page intentionally avoids fictional founders, fictional team biographies, and invented historical win-rate numbers. If a metric is public here, it comes from the current system. If we are not tracking it yet, we say that directly.
                        </p>
                    </div>
                </section>

                <section className={styles.missionSection}>
                    <blockquote className={styles.missionQuote}>
                        &ldquo;Confidence should come from visible signals, not marketing promises.&rdquo;
                    </blockquote>
                    <span className={styles.missionAttribution}>
                        — Pragati Setu operating principle
                    </span>
                </section>

                <section className={styles.teamSection}>
                    <h2 className={styles.sectionTitle}>What powers the platform.</h2>
                    <div className={styles.teamGrid}>
                        {PLATFORM_AREAS.map((area) => (
                            <div key={area.title} className={styles.teamCard}>
                                <div className={`${styles.teamAvatar} ${area.avatarClass}`}>
                                    <span className={styles.teamAvatarText}>{area.avatarLabel}</span>
                                </div>
                                <h3 className={styles.teamName}>{area.title}</h3>
                                <span className={styles.teamRole}>{area.role}</span>
                                <p className={styles.teamBio}>{area.summary}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.reportSection}>
                    <h2 className={styles.sectionTitle}>Live transparency snapshot.</h2>
                    <p className={styles.reportIntro}>
                        These counts are pulled from current platform tables. Historical guarantee payout, claims resolved, and claim-free-rate figures are intentionally omitted until guarantee events are tracked in a dedicated table.
                    </p>

                    <div className={styles.statGrid}>
                        {snapshotCards.map((stat) => (
                            <div key={stat.label} className={styles.statCard}>
                                <span className={styles.statValue}>{stat.value}</span>
                                <span className={styles.statLabel}>{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    <p className={styles.reportMeta}>
                        Newsletter subscribers on file: {formatCount(snapshot.newsletter_subscribers)}.
                    </p>
                    <p className={styles.reportMeta}>{briefMeta}</p>

                    <Link className={styles.btnDownload} href={briefHref}>
                        {briefLabel}
                        <span aria-hidden="true">&rarr;</span>
                    </Link>
                </section>

                <section className={styles.valuesSection}>
                    <h2 className={styles.sectionTitle}>Our values.</h2>
                    <div className={styles.valuesGrid}>
                        {VALUES.map((value) => (
                            <div key={value.title} className={styles.valueCard}>
                                <h3 className={styles.valueTitle}>{value.title}</h3>
                                <p className={styles.valueText}>{value.text}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            <Footer />
        </PageWrapper>
    );
}

async function getAboutSnapshot(): Promise<AboutSnapshotRow> {
    try {
        const row = await queryOne<AboutSnapshotRow>(
            `SELECT
                (SELECT COUNT(*)::int
                 FROM decision_passports
                 WHERE is_active = true) AS active_passports,
                (SELECT COUNT(*)::int
                 FROM guides
                 WHERE is_active = true) AS active_guides,
                (SELECT COUNT(*)::int
                 FROM safety_alerts
                 WHERE is_active = true) AS active_alerts,
                (SELECT COUNT(*)::int
                 FROM blog_posts
                 WHERE published = true) AS published_briefs,
                (SELECT COUNT(*)::int
                 FROM newsletter_subscribers
                 WHERE is_active = true) AS newsletter_subscribers`
        );

        return row ?? {
            active_passports: 0,
            active_guides: 0,
            active_alerts: 0,
            published_briefs: 0,
            newsletter_subscribers: 0,
        };
    } catch (error) {
        console.error("Failed to load About snapshot:", error);
        return {
            active_passports: 0,
            active_guides: 0,
            active_alerts: 0,
            published_briefs: 0,
            newsletter_subscribers: 0,
        };
    }
}

async function getLatestPublishedBrief(): Promise<PublishedBriefRow | null> {
    try {
        return await queryOne<PublishedBriefRow>(
            `SELECT
                title,
                slug,
                author,
                published_at,
                created_at
             FROM blog_posts
             WHERE published = true
             ORDER BY COALESCE(published_at, created_at) DESC
             LIMIT 1`
        );
    } catch (error) {
        console.error("Failed to load latest brief:", error);
        return null;
    }
}

function formatCount(value: number): string {
    return value.toLocaleString("en-IN");
}

function formatPublishedDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unscheduled";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}
