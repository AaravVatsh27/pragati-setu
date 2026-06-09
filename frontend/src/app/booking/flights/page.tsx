"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import styles from "./flights.module.css";
import type {
    Airport,
    FlightResult,
    FlightSelection,
} from "@/lib/flights";
import { FLIGHT_SELECTION_STORAGE_KEY } from "@/lib/flights";

// ─── Inline SVG icons ──────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);
const SwapIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
    </svg>
);
const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
);
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
const MinusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>;
const XIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
const EditIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const AlertIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 14H11v-2h2v2zm0-4H11V7h2v5z" /></svg>;
const ShieldIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;

// ─── Default airports ──────────────────────────────────────────────────────
const DEFAULT_FROM: Airport = {
    code: 'BOM',
    name: 'Chhatrapati Shivaji Maharaj Intl',
    city: 'Mumbai',
    country: 'India',
};
const DEFAULT_TO: Airport = {
    code: 'TYO',
    name: 'Narita International',
    city: 'Tokyo',
    country: 'Japan',
};

// ─── StarField canvas ──────────────────────────────────────────────────────
function StarField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const setSize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        setSize();

        const stars = Array.from({ length: 200 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.5 + 0.5,
            baseAlpha: Math.random() * 0.4 + 0.1,
            phase: Math.random() * Math.PI * 2,
            speed: (Math.random() * 0.005 + 0.002),
            twinkle: Math.random() > 0.6,
        }));

        let animId: number;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach((s) => {
                const alpha = s.twinkle
                    ? s.baseAlpha + Math.sin(s.phase) * 0.15
                    : s.baseAlpha;
                s.phase += s.speed;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${Math.max(0, alpha)})`;
                ctx.fill();
            });
            animId = requestAnimationFrame(draw);
        };
        draw();

        const ro = new ResizeObserver(setSize);
        ro.observe(canvas);
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <canvas ref={canvasRef} className={styles.starCanvas} />;
}

// ─── Flight Arc SVG ───────────────────────────────────────────────────────
function FlightArc() {
    return (
        <div className={styles.arcContainer} aria-hidden="true">
            <svg className={styles.arcSvg} viewBox="0 0 1440 900" preserveAspectRatio="none">
                <defs>
                    <path id="arc-path" d="M 80 750 Q 720 100 1360 280" />
                </defs>
                <path
                    d="M 80 750 Q 720 100 1360 280"
                    fill="none"
                    stroke="rgba(212, 89, 10, 0.35)"
                    strokeWidth="1.5"
                    strokeDasharray="2400"
                    strokeDashoffset="2400"
                    style={{
                        animation: "drawArc 2.2s cubic-bezier(0.4,0,0.2,1) 0.3s forwards",
                    }}
                />
                {/* ✈ emoji sliding along arc */}
                <text
                    fontSize="22"
                    style={{
                        animation: "slideAlongArc 6s linear 2.5s infinite",
                        offsetPath: "path('M 80 750 Q 720 100 1360 280')",
                    } as React.CSSProperties}
                >
                    ✈
                </text>
            </svg>
            <style>{`
        @keyframes drawArc {
          to { stroke-dashoffset: 0; }
        }
        @keyframes slideAlongArc {
          from { offset-distance: 0%; opacity: 0; }
          5%    { opacity: 1; }
          95%   { opacity: 1; }
          to    { offset-distance: 100%; opacity: 0; }
        }
      `}</style>
        </div>
    );
}

// ─── View enum ────────────────────────────────────────────────────────────
type View = "search" | "results";

// ─── Main component ───────────────────────────────────────────────────────
export default function FlightsPage() {
    const router = useRouter();
    const [view, setView] = useState<View>("search");

    // Form state
    const [from, setFrom] = useState<Airport>(DEFAULT_FROM);
    const [to, setTo] = useState<Airport>(DEFAULT_TO);
    const [isOneWay, setIsOneWay] = useState(false);
    const [passengers, setPassengers] = useState(1);
    const [cabinClass, setCabinClass] = useState("Economy");

    // Date state — defaults to 30 days from now
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const formatInputDate = (d: Date) => d.toISOString().split('T')[0];

    const [departureDate, setDepartureDate] = useState(formatInputDate(nextMonth));
    const [returnDateVal, setReturnDateVal] = useState(
        formatInputDate(new Date(nextMonth.getTime() + 8 * 24 * 60 * 60 * 1000))
    );

    // Modal state
    type ModalT = "from" | "to" | null;
    const [modal, setModal] = useState<ModalT>(null);
    const [query, setQuery] = useState("");

    // Results state
    const [activeSort, setActiveSort] = useState("Best");
    const [priceRange, setPriceRange] = useState(200000);
    const [arriveBeforeDark, setArriveBeforeDark] = useState(true);
    const [safeLayovers, setSafeLayovers] = useState(true);
    const [stopFilter, setStopFilter] = useState<string>("Any");

    // Live flight + airport search state
    const [flightResults, setFlightResults] = useState<FlightResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [airportResults, setAirportResults] = useState<Airport[]>([]);
    const [airportLoading, setAirportLoading] = useState(false);
    const airportDebounce = useRef<ReturnType<typeof setTimeout>>();

    // ── Live airport search ──────────────────────────────────────────────
    const searchAirportsLive = async (keyword: string) => {
        if (keyword.length < 2) {
            setAirportResults([]);
            return;
        }
        clearTimeout(airportDebounce.current);
        airportDebounce.current = setTimeout(async () => {
            setAirportLoading(true);
            try {
                const res = await fetch(
                    `/api/flights/search`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ keyword }),
                    }
                );
                const { data } = await res.json();
                setAirportResults(data ?? []);
            } catch {
                setAirportResults([]);
            } finally {
                setAirportLoading(false);
            }
        }, 300);
    };

    // ── Live flight search ────────────────────────────────────────────────
    const handleSearch = async () => {
        if (!from.code || !to.code) return;

        setSearching(true);
        setSearchError('');
        setFlightResults([]);

        try {
            const params = new URLSearchParams({
                origin: from.code,
                destination: to.code,
                departure: departureDate,
                adults: String(passengers),
                class: cabinClass,
            });

            if (!isOneWay) {
                params.set('return', returnDateVal);
            }

            const res = await fetch(`/api/flights/search?${params}`);
            const { data, error } = await res.json();

            if (error) throw new Error(error);

            if (!data?.length) {
                setSearchError(
                    'No flights found for this route. Try different dates or airports.'
                );
            } else {
                setFlightResults(data);
                setView('results');
            }
        } catch (err) {
            setSearchError(
                err instanceof Error
                    ? err.message
                    : 'Search failed. Please try again.'
            );
        } finally {
            setSearching(false);
        }
    };

    const handleSelectFlight = (flight: FlightResult) => {
        const selection: FlightSelection = {
            selectedAt: new Date().toISOString(),
            search: {
                from,
                to,
                departureDate,
                returnDate: isOneWay ? null : returnDateVal,
                passengers,
                cabinClass,
                oneWay: isOneWay,
            },
            flight,
        };

        window.sessionStorage.setItem(
            FLIGHT_SELECTION_STORAGE_KEY,
            JSON.stringify(selection)
        );
        router.push("/booking/flights/review");
    };

    // ── Filtered airports for modal ───────────────────────────────────────
    const filteredAirports =
        airportResults.length > 0
            ? airportResults
            : [DEFAULT_FROM, DEFAULT_TO];

    const recFlight = flightResults.find(f => f.recommended) ?? flightResults[0];
    const otherFlights = flightResults.filter(f => !f.recommended);

    // ─── Loading spinner ─────────────────────────────────────────────────
    if (searching) {
        return (
            <PageWrapper>
                <div style={{
                    minHeight: '100vh',
                    background: '#060A12',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '24px',
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        border: '3px solid rgba(212,89,10,0.2)',
                        borderTop: '3px solid #D4590A',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <p style={{
                        fontFamily: "'Sora', sans-serif",
                        fontSize: '16px',
                        color: '#9A8F82',
                    }}>
                        Searching flights…
                    </p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </PageWrapper>
        );
    }

    // ─── Results view ─────────────────────────────────────────────────────
    if (view === "results") {
        return (
            <PageWrapper>
                <div className={styles.resultsPage}>
                    {/* Sticky bar */}
                    <div className={styles.stickyBar}>
                        <div className={styles.routeSummary}>
                            <button
                                onClick={() => setView("search")}
                                style={{ background: "transparent", border: "none", color: "#9A8F82", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}
                            >
                                <ArrowLeftIcon />
                            </button>
                            <div className={styles.routeInfo}>
                                <div>
                                    <span className={styles.routeLabel}>Route</span>
                                    <span className={styles.routeValue}>{from.code} → {to.code}</span>
                                </div>
                                <div className={styles.divider} />
                                <div>
                                    <span className={styles.routeLabel}>Date</span>
                                    <span className={styles.routeValue}>{departureDate}</span>
                                </div>
                                <div className={styles.divider} />
                                <div>
                                    <span className={styles.routeLabel}>Pass.</span>
                                    <span className={styles.routeValue}>{passengers} Adult</span>
                                </div>
                                <button className={styles.editBtn} onClick={() => setView("search")}>
                                    <EditIcon /> Edit
                                </button>
                            </div>
                        </div>
                        <div className={styles.sortTabs}>
                            {["Best", "Cheapest", "Fastest", "Safest"].map(s => (
                                <button
                                    key={s}
                                    className={`${styles.sortTab} ${activeSort === s ? styles.sortTabActive : ""}`}
                                    onClick={() => setActiveSort(s)}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Body */}
                    <div className={styles.resultsBody}>
                        {/* Filter sidebar */}
                        <aside className={styles.filterSidebar}>
                            <div className={styles.filterGroup}>
                                <h2 className={styles.filterSectionTitle}>Filters</h2>

                                <label className={styles.filterLabel}>Price Range</label>
                                <input
                                    type="range" min={30000} max={300000} step={1000}
                                    value={priceRange}
                                    onChange={e => setPriceRange(+e.target.value)}
                                    className={styles.rangeSlider}
                                />
                                <div className={styles.rangeLabels}>
                                    <span>₹30k</span>
                                    <span className={styles.rangeActiveLabel}>Up to ₹{(priceRange / 1000).toFixed(0)}k</span>
                                </div>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Stops</label>
                                <div className={styles.stopPills}>
                                    {["Direct", "1 Stop", "Any"].map(s => (
                                        <button
                                            key={s}
                                            className={`${styles.stopPill} ${stopFilter === s ? styles.stopPillActive : ""}`}
                                            onClick={() => setStopFilter(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.filterDivider} />

                            <div className={styles.filterGroup}>
                                <h2 className={styles.filterSectionTitle}>
                                    <ShieldIcon /> Safety &amp; Intelligence
                                </h2>

                                <div className={styles.toggleRow}>
                                    <div>
                                        <div className={styles.toggleLabel}>Arrive before dark</div>
                                        <div className={styles.toggleSub}>Reduces scam risk on arrival</div>
                                    </div>
                                    <button
                                        className={`${styles.toggle} ${arriveBeforeDark ? styles.toggleActive : ""}`}
                                        onClick={() => setArriveBeforeDark(v => !v)}
                                        aria-pressed={arriveBeforeDark}
                                    >
                                        <div className={`${styles.toggleKnob} ${arriveBeforeDark ? styles.toggleKnobOn : styles.toggleKnobOff}`} />
                                    </button>
                                </div>

                                <div className={styles.toggleRow}>
                                    <div>
                                        <div className={styles.toggleLabel}>Safe layovers</div>
                                        <div className={styles.toggleSub}>Flag high-risk airports</div>
                                    </div>
                                    <button
                                        className={`${styles.toggle} ${safeLayovers ? styles.toggleActive : ""}`}
                                        onClick={() => setSafeLayovers(v => !v)}
                                        aria-pressed={safeLayovers}
                                    >
                                        <div className={`${styles.toggleKnob} ${safeLayovers ? styles.toggleKnobOn : styles.toggleKnobOff}`} />
                                    </button>
                                </div>

                                <div className={styles.toggleRow}>
                                    <div>
                                        <div className={styles.toggleLabel}>Luggage included</div>
                                    </div>
                                    <button className={styles.toggle} aria-pressed={false}>
                                        <div className={`${styles.toggleKnob} ${styles.toggleKnobOff}`} />
                                    </button>
                                </div>

                                <div className={styles.toggleRow}>
                                    <div>
                                        <div className={styles.toggleLabel}>Meal included</div>
                                    </div>
                                    <button className={styles.toggle} aria-pressed={false}>
                                        <div className={`${styles.toggleKnob} ${styles.toggleKnobOff}`} />
                                    </button>
                                </div>

                                <button className={styles.applyBtn}>Apply Filters</button>
                                <button className={styles.resetBtn}>Reset Filters</button>
                            </div>
                        </aside>

                        {/* Results main */}
                        <main className={styles.resultsMain}>
                            {recFlight && (
                                /* Recommended card */
                                <div className={styles.recommendedCard}>
                                    <span className={styles.recLabel}>🧭 Pragati Setu Recommends</span>

                                    <div className={styles.flightHeader}>
                                        <div className={styles.airlineLogo}>{recFlight.code}</div>
                                        <div className={styles.airlineInfo}>
                                            <div className={styles.airlineName}>{recFlight.airline}</div>
                                            <div className={styles.flightNum}>{recFlight.flightNo}</div>
                                        </div>
                                        <div className={styles.priceBlock}>
                                            <div className={styles.price}>{recFlight.price}</div>
                                            <div className={styles.priceSub}>per person</div>
                                        </div>
                                    </div>

                                    <div className={styles.timesRow}>
                                        <div className={styles.timeBlock}>
                                            <div className={styles.timeVal}>{recFlight.departure}</div>
                                            <div className={styles.timeSub}>{from.city} ({from.code})</div>
                                        </div>
                                        <div className={styles.lineBlock}>
                                            <span className={styles.duration}>{recFlight.duration}</span>
                                            <div className={styles.line} />
                                            <span className={styles.stops}>{recFlight.stops}</span>
                                        </div>
                                        <div className={styles.timeBlock}>
                                            <div className={styles.timeVal}>{recFlight.arrival}</div>
                                            <div className={styles.timeSub}>{to.city} ({to.code})</div>
                                        </div>
                                    </div>

                                    <div className={styles.statsRow}>
                                        <div className={styles.stat}>🧳 Luggage: <span style={{ color: "#F2EDE4" }}>&nbsp;{recFlight.luggage}</span></div>
                                        <div className={styles.stat}>🍽 Meal: <span style={{ color: "#F2EDE4" }}>&nbsp;{recFlight.meal ? "Included" : "—"}</span></div>
                                    </div>

                                    {recFlight.reason && (
                                        <div className={styles.whyBox}>
                                            <p className={styles.whyText}>
                                                &ldquo;Why we recommend this: {recFlight.reason}&rdquo;
                                            </p>
                                        </div>
                                    )}

                                    <div className={styles.actionsRow}>
                                        <div className={styles.confidencePill}>
                                            <div className={styles.confidenceDot} />
                                            <span className={styles.confidenceLabel}>Confidence: {recFlight.confidence}/100</span>
                                        </div>
                                        <div className={styles.btnGroup}>
                                            <button
                                                className={styles.ghostBtn}
                                                onClick={() => window.location.href = "/decision-passport"}
                                            >
                                                Add to Passport
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.bookBtn}
                                                onClick={() => handleSelectFlight(recFlight)}
                                            >
                                                Continue in Pragati Setu →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* All results */}
                            <div className={styles.resultsHeader}>
                                <span className={styles.resultsCount}>All available flights ({flightResults.length})</span>
                                <span className={styles.resultsMeta}>Price per passenger, inclusive of taxes. Selected fares are revalidated with Amadeus before booking.</span>
                            </div>

                            {otherFlights.map(flight => (
                                <div
                                    key={flight.id}
                                    className={`${styles.resultCard} ${flight.warning ? styles.resultCardWarning : ""}`}
                                >
                                    <div className={styles.cardAirline}>
                                        <div className={styles.cardLogoBox}>{flight.code}</div>
                                        <div>
                                            {flight.warning && (
                                                <div className={styles.warningBadge}><AlertIcon /> Safety Alert</div>
                                            )}
                                            <div className={styles.cardAirlineName}>{flight.airline}</div>
                                            <div className={styles.cardFlightNum}>{flight.flightNo}</div>
                                        </div>
                                    </div>

                                    <div className={styles.cardRoute}>
                                        <div>
                                            <div className={styles.cardTime}>{flight.departure}</div>
                                            <div className={styles.cardCityCode}>{from.code}</div>
                                        </div>
                                        <div className={styles.cardLine}>
                                            <span className={styles.cardDuration}>{flight.duration}</span>
                                            <div className={styles.line} />
                                            <span className={`${styles.cardStops} ${flight.stops === "Direct" ? styles.cardDirect : ""}`}>
                                                {flight.stops}
                                            </span>
                                        </div>
                                        <div>
                                            <div className={styles.cardTime}>{flight.arrival}</div>
                                            <div className={styles.cardCityCode}>{to.code}</div>
                                        </div>
                                    </div>

                                    <div className={styles.cardRight}>
                                        <div className={styles.cardPrice}>{flight.price}</div>
                                        <button
                                            type="button"
                                            className={styles.selectBtn}
                                            onClick={() => handleSelectFlight(flight)}
                                        >
                                            Review in App →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </main>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    // ─── Search view ─────────────────────────────────────────────────────────
    return (
        <PageWrapper>
            <div className={styles.flightsPage}>
                <section className={styles.hero}>
                    {/* Stars */}
                    <StarField />
                    {/* Animated Arc */}
                    <FlightArc />

                    {/* Back link */}
                    <Link href="/booking" className={styles.backLink}>
                        <ArrowLeftIcon /> Back to Hub
                    </Link>

                    {/* Hero header */}
                    <div className={styles.heroHeader}>
                        <h1 className={styles.heroTitle}>
                            Find Your <em className={styles.heroTitleAccent}>Flight</em>
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Intelligence-scored options from {from.city} to {to.city}.
                            Amadeus-powered search, ranked for confidence and safety.
                        </p>
                    </div>

                    {/* Search card */}
                    <div className={styles.searchCard}>
                        {/* Row 1: Origin / Destination */}
                        <div className={`${styles.formRow} ${styles.formRow1}`}>
                            <div
                                className={styles.glassInput}
                                onClick={() => { setQuery(""); setAirportResults([]); setModal("from"); }}
                            >
                                <span className={styles.inputLabel}>🛫 From</span>
                                <div className={styles.inputValue}>{from.code}</div>
                                <div className={styles.inputSubvalue}>{from.city}, {from.country}</div>
                            </div>

                            <button
                                className={styles.swapBtn}
                                onClick={() => { const tmp = from; setFrom(to); setTo(tmp); }}
                                aria-label="Swap origin and destination"
                            >
                                <SwapIcon />
                            </button>

                            <div
                                className={styles.glassInput}
                                onClick={() => { setQuery(""); setAirportResults([]); setModal("to"); }}
                            >
                                <span className={styles.inputLabel}>🛬 To</span>
                                <div className={styles.inputValue}>{to.code}</div>
                                <div className={styles.inputSubvalue}>{to.city}, {to.country}</div>
                            </div>
                        </div>

                        {/* Row 2: Dates */}
                        <div className={`${styles.formRow} ${styles.formRow2}`}>
                            <div className={styles.glassInput}>
                                <span className={styles.inputLabel}>Departure</span>
                                <input
                                    type="date"
                                    value={departureDate}
                                    min={formatInputDate(new Date())}
                                    onChange={(e) => setDepartureDate(e.target.value)}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: '#F2EDE4', fontSize: '18px',
                                        fontFamily: "'Cormorant Garamond', serif",
                                        fontWeight: 700, cursor: 'pointer',
                                        outline: 'none', width: '100%',
                                        colorScheme: 'dark',
                                    }}
                                />
                                <div className={styles.inputSubvalue}>
                                    {departureDate
                                        ? new Date(departureDate).toLocaleDateString('en-IN', { weekday: 'long' })
                                        : 'Select date'}
                                </div>
                            </div>
                            <div
                                className={`${styles.glassInput}`}
                                style={isOneWay ? { opacity: 0.35, filter: "grayscale(1)", cursor: "not-allowed" } : {}}
                            >
                                <span className={styles.inputLabel}>Return</span>
                                {isOneWay ? (
                                    <div className={styles.inputValue} style={{ fontSize: 18 }}>—</div>
                                ) : (
                                    <input
                                        type="date"
                                        value={returnDateVal}
                                        min={departureDate}
                                        onChange={(e) => setReturnDateVal(e.target.value)}
                                        style={{
                                            background: 'none', border: 'none',
                                            color: '#F2EDE4', fontSize: '18px',
                                            fontFamily: "'Cormorant Garamond', serif",
                                            fontWeight: 700, cursor: 'pointer',
                                            outline: 'none', width: '100%',
                                            colorScheme: 'dark',
                                        }}
                                    />
                                )}
                                <div className={styles.inputSubvalue}>{isOneWay ? "One way" : ""}</div>
                            </div>
                            <button
                                className={`${styles.oneWayToggle} ${isOneWay ? styles.oneWayToggleActive : ""}`}
                                onClick={() => setIsOneWay(v => !v)}
                            >
                                {isOneWay ? "ONE WAY" : "ROUND TRIP"}
                            </button>
                        </div>

                        {/* Row 3: Passengers & Class */}
                        <div className={`${styles.formRow} ${styles.formRow3}`}>
                            <div className={styles.passengerBox}>
                                <div>
                                    <span className={styles.passengerLabel}>Passengers</span>
                                    <span className={styles.passengerCount}>{passengers} Traveler{passengers > 1 ? "s" : ""}</span>
                                </div>
                                <div className={styles.counterBtns}>
                                    <button
                                        className={styles.counterBtn}
                                        onClick={() => setPassengers(v => Math.max(1, v - 1))}
                                        disabled={passengers <= 1}
                                        aria-label="Decrease passengers"
                                    >
                                        <MinusIcon />
                                    </button>
                                    <span style={{ color: "#F2EDE4", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, minWidth: 24, textAlign: "center" }}>{passengers}</span>
                                    <button
                                        className={styles.counterBtn}
                                        onClick={() => setPassengers(v => Math.min(9, v + 1))}
                                        disabled={passengers >= 9}
                                        aria-label="Increase passengers"
                                    >
                                        <PlusIcon />
                                    </button>
                                </div>
                            </div>

                            <select
                                className={styles.glassSelect}
                                value={cabinClass}
                                onChange={e => setCabinClass(e.target.value)}
                                aria-label="Select cabin class"
                            >
                                <option value="Economy">Economy</option>
                                <option value="Premium Economy">Premium Economy</option>
                                <option value="Business">Business</option>
                                <option value="First">First</option>
                            </select>
                        </div>

                        {/* Search button */}
                        <button
                            className={styles.searchBtn}
                            onClick={handleSearch}
                            disabled={searching}
                        >
                            {searching
                                ? '⏳ Searching flights…'
                                : '🔍 Search Flights — Confidence Scored'
                            }
                        </button>

                        {/* Error display */}
                        {searchError && (
                            <div style={{
                                padding: '12px 16px',
                                background: 'rgba(232,69,60,0.08)',
                                border: '1px solid rgba(232,69,60,0.25)',
                                borderRadius: '10px',
                                color: '#E8453C',
                                fontFamily: "'Sora', sans-serif",
                                fontSize: '13px',
                                marginBottom: '16px',
                                textAlign: 'center',
                            }}>
                                {searchError}
                            </div>
                        )}

                        {/* Trust badges */}
                        <div className={styles.trustRow}>
                            <span className={styles.trustBadge}>✓ 100% SECURE</span>
                            <span className={styles.trustBadge}>✓ CONFIDENCE SCORED</span>
                            <span className={styles.trustBadge}>✓ REAL-TIME INTEL</span>
                        </div>
                    </div>
                </section>

                {/* ─── Airport Modal ──────────────────────────────────────────── */}
                {modal && (
                    <div className={styles.modalOverlay} onClick={() => setModal(null)}>
                        <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>
                                    Select {modal === "from" ? "Origin" : "Destination"}
                                </h2>
                                <button className={styles.modalCloseBtn} onClick={() => setModal(null)}>
                                    <XIcon />
                                </button>
                            </div>
                            <div className={styles.modalSearch}>
                                <span className={styles.modalSearchIcon}><SearchIcon /></span>
                                <input
                                    className={styles.modalSearchInput}
                                    autoFocus
                                    type="text"
                                    placeholder="Search city or airport..."
                                    value={query}
                                    onChange={e => {
                                        setQuery(e.target.value);
                                        searchAirportsLive(e.target.value);
                                    }}
                                />
                            </div>
                            <div className={styles.modalList}>
                                {airportLoading && (
                                    <div style={{ padding: '16px', color: '#9A8F82', fontSize: '13px', textAlign: 'center' }}>
                                        Searching airports…
                                    </div>
                                )}
                                {filteredAirports.map(airport => (
                                    <div
                                        key={airport.code}
                                        className={styles.airportItem}
                                        onClick={() => {
                                            if (modal === "from") setFrom(airport);
                                            else setTo(airport);
                                            setModal(null);
                                            setAirportResults([]);
                                        }}
                                    >
                                        <div>
                                            <div className={styles.airportName}>{airport.city}, {airport.country}</div>
                                            <div className={styles.airportSub}>{airport.name}</div>
                                        </div>
                                        <div className={styles.airportCode}>{airport.code}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
