import React from "react";
import type { Metadata } from "next";
import PageWrapper from "@/components/PageWrapper";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { query } from "@/lib/db";

export const metadata: Metadata = {
    title: "Find a Local Guide",
    description: "Connect with verified local experts in your destination. Pragati Setu guides speak your language and are background-checked before your trip.",
};
import GuidesPageClient, {
    type GuideCardData,
    type GuideCityFilter,
    type GuideHeroPreview,
    type GuidePricingTier,
    type GuideStat,
} from "./GuidesPageClient";

interface GuideRow {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    city_name: string | null;
    country_name: string | null;
    bio: string | null;
    languages: string[] | null;
    specialties: string[] | null;
    tier_chat: boolean;
    tier_video: boolean;
    tier_inperson: boolean;
    price_chat_inr: number;
    price_video_inr: number;
    price_inperson_inr: number;
    avg_rating: number;
    total_reviews: number;
    total_sessions: number;
    verification_status: string;
}

interface AlertRow {
    city_name: string | null;
    country_name: string | null;
    title: string;
    description: string | null;
}

export default async function LocalGuidesPage() {
    const [guideRows, alertRows] = await Promise.all([
        query<GuideRow>(
            `SELECT
                g.id,
                u.full_name,
                u.avatar_url,
                g.city_name,
                g.country_name,
                g.bio,
                g.languages,
                g.specialties,
                g.tier_chat,
                g.tier_video,
                g.tier_inperson,
                g.price_chat_inr,
                g.price_video_inr,
                g.price_inperson_inr,
                g.avg_rating,
                g.total_reviews,
                g.total_sessions,
                g.verification_status
             FROM guides g
             JOIN users u
               ON u.id = g.user_id
             WHERE g.is_active = true
             ORDER BY g.total_reviews DESC, g.total_sessions DESC, u.full_name ASC`,
            []
        ),
        query<AlertRow>(
            `SELECT
                city_name,
                country_name,
                title,
                description
             FROM safety_alerts
             WHERE is_active = true
             ORDER BY created_at DESC
             LIMIT 100`,
            []
        ),
    ]);

    const guides = guideRows.map<GuideCardData>((row, index) => {
        const alert = findAlertForGuide(row, alertRows);
        const name = row.full_name?.trim() || "Local Guide";
        const city = row.city_name?.trim() || "City pending";
        const country = row.country_name?.trim() || "";
        const sessionModes = [
            row.tier_chat ? "💬 Chat" : null,
            row.tier_video ? "📹 Video" : null,
            row.tier_inperson ? "🤝 In-Person" : null,
        ].filter(Boolean) as string[];

        return {
            id: row.id,
            name,
            city,
            country,
            cityLabel: country ? `${city}, ${country}` : city,
            cityKey: city.toLowerCase(),
            flag: getCountryFlag(country),
            avatarUrl: row.avatar_url,
            avatarClass: getAvatarClass(index),
            availability:
                row.tier_chat || row.total_sessions > 0
                    ? "Sessions open"
                    : "Booking by request",
            availabilityStatus:
                row.tier_chat || row.total_sessions > 0 ? "online" : "away",
            languages: row.languages?.length ? row.languages : ["English"],
            specialties: row.specialties?.length ? row.specialties : ["LOCAL"],
            fieldReport:
                alert?.description?.trim() ||
                alert?.title?.trim() ||
                row.bio?.trim() ||
                `Fresh local guidance for ${city} is being prepared.`,
            rating: row.avg_rating || 0,
            reviews: row.total_reviews || 0,
            sessionModes: sessionModes.length
                ? sessionModes
                : ["💬 By request"],
        };
    });

    const cityFilters = buildCityFilters(guides);
    const heroStats = buildHeroStats(guides, guideRows);
    const heroPreviewGuides = guides.slice(0, 3).map<GuideHeroPreview>((guide) => ({
        id: guide.id,
        flag: guide.flag,
        name: firstName(guide.name),
        city: guide.city.toUpperCase(),
    }));

    const pricingTiers: GuidePricingTier[] = [
        {
            name: "On-Demand Chat",
            price: getMinimumPositive(
                guideRows.map((guide) => guide.price_chat_inr),
                299
            ),
            unit: "/ SESSION",
            description:
                "Text or voice, answered within the guide channel. Perfect for quick questions while traveling.",
            bestFor: "Best for: Quick questions while on the ground",
            icon: "chat",
            featured: false,
        },
        {
            name: "Virtual Guide",
            price: getMinimumPositive(
                guideRows.map((guide) => guide.price_video_inr),
                999
            ),
            unit: "/ SESSION",
            description:
                "30–60 min video call deep-dive with a local expert before your trip.",
            bestFor: "Best for: Detailed pre-trip planning",
            icon: "video",
            featured: true,
        },
        {
            name: "In-Person Guide",
            price: getMinimumPositive(
                guideRows.map((guide) => guide.price_inperson_inr),
                3999
            ),
            unit: "/ DAY",
            description:
                "A full day with a vetted local expert for high-context, immersive travel.",
            bestFor: "Best for: Deep immersive experience",
            icon: "inperson",
            featured: false,
        },
    ];

    const headingLead =
        guides.length > 0
            ? `${guides.length.toLocaleString()} locals.`
            : "Local experts.";

    return (
        <PageWrapper>
            <Navbar />
            <GuidesPageClient
                cityFilters={cityFilters}
                guides={guides}
                headingLead={headingLead}
                heroPreviewGuides={heroPreviewGuides}
                heroStats={heroStats}
                pricingTiers={pricingTiers}
            />
            <Footer />
        </PageWrapper>
    );
}

function buildCityFilters(guides: GuideCardData[]): GuideCityFilter[] {
    const uniqueCities = new Map<string, GuideCityFilter>();

    guides.forEach((guide) => {
        if (!uniqueCities.has(guide.cityKey)) {
            uniqueCities.set(guide.cityKey, {
                label: guide.city,
                flag: guide.flag,
            });
        }
    });

    return [
        { label: "All", flag: "🌍" },
        ...Array.from(uniqueCities.values()).sort((a, b) =>
            a.label.localeCompare(b.label)
        ),
    ];
}

function buildHeroStats(
    guides: GuideCardData[],
    guideRows: GuideRow[]
): GuideStat[] {
    const languages = new Set(
        guides.flatMap((guide) => guide.languages.map((language) => language.toLowerCase()))
    ).size;
    const cities = new Set(
        guides.map((guide) => guide.cityKey).filter(Boolean)
    ).size;
    const verifiedCount = guideRows.filter(
        (guide) => guide.verification_status === "verified"
    ).length;

    return [
        { value: String(languages), label: languages === 1 ? "Language" : "Languages" },
        { value: String(cities), label: cities === 1 ? "City Covered" : "Cities Covered" },
        verifiedCount > 0
            ? {
                value: String(verifiedCount),
                label: verifiedCount === 1 ? "Verified Guide" : "Verified Guides",
            }
            : { value: "100%", label: "Guarantee Backed" },
        {
            value: String(guides.length),
            label: guides.length === 1 ? "Active Guide" : "Active Guides",
        },
    ];
}

function findAlertForGuide(
    guide: GuideRow,
    alerts: AlertRow[]
): AlertRow | null {
    const city = normalizeLocation(guide.city_name);
    const country = normalizeLocation(guide.country_name);

    return (
        alerts.find((alert) => normalizeLocation(alert.city_name) === city) ||
        alerts.find((alert) => normalizeLocation(alert.country_name) === country) ||
        null
    );
}

function normalizeLocation(value: string | null | undefined): string {
    return String(value ?? "").trim().toLowerCase();
}

function getAvatarClass(index: number): string {
    const classes = ["avatarA", "avatarB", "avatarC", "avatarD", "avatarE", "avatarF"];
    return classes[index % classes.length] || classes[0];
}

function getMinimumPositive(values: number[], fallback: number): number {
    const positiveValues = values.filter((value) => Number.isFinite(value) && value > 0);

    if (positiveValues.length === 0) {
        return fallback;
    }

    return Math.min(...positiveValues);
}

function getCountryFlag(country: string): string {
    const flags: Record<string, string> = {
        japan: "🇯🇵",
        france: "🇫🇷",
        thailand: "🇹🇭",
        dubai: "🇦🇪",
        uae: "🇦🇪",
        "united arab emirates": "🇦🇪",
        singapore: "🇸🇬",
        uk: "🇬🇧",
        "united kingdom": "🇬🇧",
        england: "🇬🇧",
        india: "🇮🇳",
        italy: "🇮🇹",
        australia: "🇦🇺",
        "united states": "🇺🇸",
        usa: "🇺🇸",
    };

    return flags[country.toLowerCase()] ?? "🌍";
}

function firstName(name: string): string {
    return name.split(" ")[0] || name;
}
