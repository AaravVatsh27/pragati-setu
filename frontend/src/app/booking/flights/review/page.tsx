"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import styles from "./review.module.css";
import type {
    FlightContactInput,
    FlightSelection,
    FlightTravelerInput,
} from "@/lib/flights";
import { FLIGHT_SELECTION_STORAGE_KEY } from "@/lib/flights";

type PricingSummary = {
    total: string;
    rawTotal: string;
    currency: string;
    lastTicketingDate: string | null;
    numberOfBookableSeats: number | null;
    instantTicketingRequired: boolean;
    validatingAirlineCodes: string[];
};

type PricingResponseData = {
    pricedOffer: Record<string, unknown>;
    summary: PricingSummary;
};

type BookingResponseData = {
    id: string | null;
    reference: string | null;
    provider: string;
    status: string | null;
};

const DEFAULT_CONTACT: FlightContactInput = {
    email: "",
    countryCallingCode: "91",
    phoneNumber: "",
};

function createTraveler(): FlightTravelerInput {
    return {
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        documentType: "PASSPORT",
        documentNumber: "",
        birthPlace: "",
        issuanceLocation: "",
        issuanceDate: "",
        expiryDate: "",
        issuanceCountry: "IN",
        validityCountry: "IN",
        nationality: "IN",
    };
}

function formatDateLabel(value: string | null) {
    if (!value) return "Not provided";

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
        ? value
        : parsed.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
}

function readStoredSelection() {
    try {
        const raw = window.sessionStorage.getItem(FLIGHT_SELECTION_STORAGE_KEY);
        if (!raw) return null;

        return JSON.parse(raw) as FlightSelection;
    } catch {
        window.sessionStorage.removeItem(FLIGHT_SELECTION_STORAGE_KEY);
        return null;
    }
}

function validateBooking(
    contact: FlightContactInput,
    travelers: FlightTravelerInput[]
) {
    const emailOkay = /\S+@\S+\.\S+/.test(contact.email);
    if (!emailOkay) return "Enter a valid contact email address.";
    if (!contact.countryCallingCode.trim()) return "Enter a country calling code.";
    if (!contact.phoneNumber.trim()) return "Enter a contact phone number.";

    for (let index = 0; index < travelers.length; index += 1) {
        const traveler = travelers[index];
        if (
            !traveler.firstName ||
            !traveler.lastName ||
            !traveler.dateOfBirth ||
            !traveler.gender ||
            !traveler.documentType ||
            !traveler.documentNumber ||
            !traveler.birthPlace ||
            !traveler.issuanceLocation ||
            !traveler.issuanceDate ||
            !traveler.expiryDate ||
            !traveler.issuanceCountry ||
            !traveler.validityCountry ||
            !traveler.nationality
        ) {
            return `Complete all fields for traveler ${index + 1}.`;
        }
    }

    return null;
}

export default function FlightReviewPage() {
    const [selection, setSelection] = useState<FlightSelection | null>(null);
    const [travelers, setTravelers] = useState<FlightTravelerInput[]>([]);
    const [contact, setContact] = useState<FlightContactInput>(DEFAULT_CONTACT);
    const [pricing, setPricing] = useState<PricingResponseData | null>(null);
    const [pricingLoading, setPricingLoading] = useState(true);
    const [pricingError, setPricingError] = useState("");
    const [bookingError, setBookingError] = useState("");
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingResult, setBookingResult] = useState<BookingResponseData | null>(null);

    useEffect(() => {
        const nextSelection = readStoredSelection();
        if (!nextSelection) {
            setPricingLoading(false);
            return;
        }

        setSelection(nextSelection);
        setTravelers(
            Array.from(
                { length: Math.max(1, nextSelection.search.passengers) },
                () => createTraveler()
            )
        );
    }, []);

    useEffect(() => {
        if (!selection) return;

        let cancelled = false;

        const loadPricing = async () => {
            setPricingLoading(true);
            setPricingError("");

            try {
                const res = await fetch("/api/flights/price", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ offer: selection.flight.amadeusOffer }),
                });
                const payload = await res.json();

                if (!res.ok || payload.error) {
                    throw new Error(payload.error ?? "Unable to revalidate the fare.");
                }

                if (!cancelled) {
                    setPricing(payload.data as PricingResponseData);
                }
            } catch (error) {
                if (!cancelled) {
                    setPricingError(
                        error instanceof Error
                            ? error.message
                            : "Unable to revalidate the fare."
                    );
                }
            } finally {
                if (!cancelled) {
                    setPricingLoading(false);
                }
            }
        };

        loadPricing();
        return () => {
            cancelled = true;
        };
    }, [selection]);

    const updateTraveler = (
        index: number,
        key: keyof FlightTravelerInput,
        value: string
    ) => {
        setTravelers((current) =>
            current.map((traveler, travelerIndex) =>
                travelerIndex === index
                    ? { ...traveler, [key]: value }
                    : traveler
            )
        );
    };

    const handleBook = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setBookingError("");
        setBookingResult(null);

        const validationError = validateBooking(contact, travelers);
        if (validationError) {
            setBookingError(validationError);
            return;
        }

        if (!pricing) {
            setBookingError("Revalidate the selected fare before trying to book.");
            return;
        }

        setBookingLoading(true);

        try {
            const res = await fetch("/api/flights/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pricedOffer: pricing.pricedOffer,
                    travelers,
                    contact,
                }),
            });
            const payload = await res.json();

            if (!res.ok || payload.error) {
                throw new Error(payload.error ?? "Flight booking failed.");
            }

            window.sessionStorage.removeItem(FLIGHT_SELECTION_STORAGE_KEY);
            setBookingResult(payload.data as BookingResponseData);
        } catch (error) {
            setBookingError(
                error instanceof Error
                    ? error.message
                    : "Flight booking failed."
            );
        } finally {
            setBookingLoading(false);
        }
    };

    if (!selection) {
        return (
            <PageWrapper>
                <div className={styles.page}>
                    <div className={styles.shell}>
                        <div className={styles.emptyState}>
                            <div className={styles.eyebrow}>Amadeus Review</div>
                            <h1 className={styles.title}>No flight selected</h1>
                            <p className={styles.subtitle}>
                                Start from the flight search page, pick an Amadeus offer,
                                and then return here to review the fare and continue with
                                booking inside Pragati Setu.
                            </p>
                            <div style={{ marginTop: 24 }}>
                                <Link href="/booking/flights" className={styles.secondaryLink}>
                                    Go back to flight search
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className={styles.page}>
                <div className={styles.shell}>
                    <Link href="/booking/flights" className={styles.backLink}>
                        ← Back to flights
                    </Link>

                    <header className={styles.header}>
                        <div className={styles.eyebrow}>Amadeus Booking Flow</div>
                        <h1 className={styles.title}>Review fare and traveler details</h1>
                        <p className={styles.subtitle}>
                            Pragati Setu keeps this flow inside the app now. The selected
                            fare is revalidated with Amadeus before booking, and order
                            creation happens through the server once traveler details are
                            complete.
                        </p>
                    </header>

                    <div className={styles.layout}>
                        <aside className={styles.stack}>
                            <section className={styles.card}>
                                <h2 className={styles.cardTitle}>Selected flight</h2>
                                <div className={styles.route}>
                                    <div>
                                        <div className={styles.routeCode}>
                                            {selection.search.from.code} → {selection.search.to.code}
                                        </div>
                                        <div className={styles.routeMeta}>
                                            {selection.search.from.city} to {selection.search.to.city}
                                        </div>
                                    </div>
                                    <div>
                                        <div className={styles.price}>{selection.flight.price}</div>
                                        <div className={styles.priceLabel}>searched fare</div>
                                    </div>
                                </div>

                                <div className={styles.metaGrid}>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Airline</span>
                                        <span className={styles.metaValue}>
                                            {selection.flight.airline} · {selection.flight.flightNo}
                                        </span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Route timing</span>
                                        <span className={styles.metaValue}>
                                            {selection.flight.departure} to {selection.flight.arrival}
                                        </span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Trip date</span>
                                        <span className={styles.metaValue}>
                                            {formatDateLabel(selection.search.departureDate)}
                                        </span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Passengers</span>
                                        <span className={styles.metaValue}>
                                            {selection.search.passengers} adult
                                            {selection.search.passengers > 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Cabin</span>
                                        <span className={styles.metaValue}>
                                            {selection.search.cabinClass}
                                        </span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Duration</span>
                                        <span className={styles.metaValue}>
                                            {selection.flight.duration} · {selection.flight.stops}
                                        </span>
                                    </div>
                                </div>

                                {selection.flight.reason && (
                                    <div className={styles.notice}>
                                        {selection.flight.reason}
                                    </div>
                                )}
                            </section>

                            <section className={styles.card}>
                                <h2 className={styles.cardTitle}>Live Amadeus fare check</h2>

                                {pricingLoading && (
                                    <p className={styles.successText}>
                                        Revalidating the selected fare with Amadeus...
                                    </p>
                                )}

                                {!pricingLoading && pricing && (
                                    <>
                                        <div className={styles.price}>{pricing.summary.total}</div>
                                        <div className={styles.priceLabel}>
                                            current confirmed total from Amadeus
                                        </div>

                                        <div className={styles.metaGrid}>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Validating airline</span>
                                                <span className={styles.metaValue}>
                                                    {pricing.summary.validatingAirlineCodes.length
                                                        ? pricing.summary.validatingAirlineCodes.join(", ")
                                                        : "Returned by airline at booking"}
                                                </span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Bookable seats</span>
                                                <span className={styles.metaValue}>
                                                    {pricing.summary.numberOfBookableSeats ?? "Not provided"}
                                                </span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Last ticketing date</span>
                                                <span className={styles.metaValue}>
                                                    {formatDateLabel(pricing.summary.lastTicketingDate)}
                                                </span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Instant ticketing</span>
                                                <span className={styles.metaValue}>
                                                    {pricing.summary.instantTicketingRequired ? "Required" : "Not required"}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!pricingLoading && pricingError && (
                                    <div className={styles.error}>
                                        <p className={styles.errorText}>{pricingError}</p>
                                    </div>
                                )}
                            </section>

                            {bookingResult && (
                                <section className={styles.card}>
                                    <div className={styles.success}>
                                        <h2 className={styles.successTitle}>Booking created</h2>
                                        <p className={styles.successText}>
                                            Provider: {bookingResult.provider}
                                            <br />
                                            Order ID: {bookingResult.id ?? "Pending"}
                                            <br />
                                            Reference: {bookingResult.reference ?? "Pending"}
                                        </p>
                                    </div>
                                </section>
                            )}
                        </aside>

                        <main className={styles.card}>
                            <form className={styles.form} onSubmit={handleBook}>
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Primary contact</h2>
                                    <div className={styles.fieldGridThree}>
                                        <div className={styles.field}>
                                            <label htmlFor="contact-email">Email</label>
                                            <input
                                                id="contact-email"
                                                className={styles.input}
                                                type="email"
                                                value={contact.email}
                                                onChange={(event) =>
                                                    setContact((current) => ({
                                                        ...current,
                                                        email: event.target.value,
                                                    }))
                                                }
                                                placeholder="traveler@example.com"
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label htmlFor="contact-code">Country code</label>
                                            <input
                                                id="contact-code"
                                                className={styles.input}
                                                value={contact.countryCallingCode}
                                                onChange={(event) =>
                                                    setContact((current) => ({
                                                        ...current,
                                                        countryCallingCode: event.target.value,
                                                    }))
                                                }
                                                placeholder="91"
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label htmlFor="contact-phone">Phone number</label>
                                            <input
                                                id="contact-phone"
                                                className={styles.input}
                                                value={contact.phoneNumber}
                                                onChange={(event) =>
                                                    setContact((current) => ({
                                                        ...current,
                                                        phoneNumber: event.target.value,
                                                    }))
                                                }
                                                placeholder="9876543210"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Travelers</h2>

                                    {travelers.map((traveler, index) => (
                                        <div className={styles.travelerCard} key={`traveler-${index + 1}`}>
                                            <h3 className={styles.travelerTitle}>
                                                Traveler {index + 1}
                                            </h3>

                                            <div className={styles.fieldGrid}>
                                                <div className={styles.field}>
                                                    <label htmlFor={`firstName-${index}`}>First name</label>
                                                    <input
                                                        id={`firstName-${index}`}
                                                        className={styles.input}
                                                        value={traveler.firstName}
                                                        onChange={(event) =>
                                                            updateTraveler(index, "firstName", event.target.value)
                                                        }
                                                        placeholder="Aarav"
                                                    />
                                                </div>
                                                <div className={styles.field}>
                                                    <label htmlFor={`lastName-${index}`}>Last name</label>
                                                    <input
                                                        id={`lastName-${index}`}
                                                        className={styles.input}
                                                        value={traveler.lastName}
                                                        onChange={(event) =>
                                                            updateTraveler(index, "lastName", event.target.value)
                                                        }
                                                        placeholder="Sharma"
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.fieldGridThree}>
                                                <div className={styles.field}>
                                                    <label htmlFor={`dob-${index}`}>Date of birth</label>
                                                    <input
                                                        id={`dob-${index}`}
                                                        className={styles.input}
                                                        type="date"
                                                        value={traveler.dateOfBirth}
                                                        onChange={(event) =>
                                                            updateTraveler(index, "dateOfBirth", event.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div className={styles.field}>
                                                    <label htmlFor={`gender-${index}`}>Gender</label>
                                                    <select
                                                        id={`gender-${index}`}
                                                        className={styles.select}
                                                        value={traveler.gender}
                                                        onChange={(event) =>
                                                            updateTraveler(index, "gender", event.target.value)
                                                        }
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="MALE">Male</option>
                                                        <option value="FEMALE">Female</option>
                                                    </select>
                                                </div>
                                                <div className={styles.field}>
                                                    <label htmlFor={`documentType-${index}`}>Document</label>
                                                    <select
                                                        id={`documentType-${index}`}
                                                        className={styles.select}
                                                        value={traveler.documentType}
                                                        onChange={(event) =>
                                                            updateTraveler(index, "documentType", event.target.value)
                                                        }
                                                    >
                                                        <option value="PASSPORT">Passport</option>
                                                        <option value="ID_CARD">ID card</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className={styles.fieldGrid}>
                                                <div className={styles.field}>
                                                    <label htmlFor={`documentNumber-${index}`}>Document number</label>
                                                    <input
                                                        id={`documentNumber-${index}`}
                                                        className={styles.input}
                                                        value={traveler.documentNumber}
                                                        onChange={(event) =>
                                                            updateTraveler(index, "documentNumber", event.target.value)
                                                        }
                                                        placeholder="Passport or ID number"
                                                    />
                                                </div>
                                                <div className={styles.field}>
                                                    <label htmlFor={`birthPlace-${index}`}>Birth place</label>
                                                    <input
                                                        id={`birthPlace-${index}`}
                                                        className={styles.input}
                                                        value={traveler.birthPlace}
                                                        onChange={(event) =>
                                                            updateTraveler(index, "birthPlace", event.target.value)
                                                        }
                                                        placeholder="Mumbai"
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.fieldGrid}>
                                                <div className={styles.field}>
                                                    <label htmlFor={`issuanceLocation-${index}`}>Issuance location</label>
                                                    <input
                                                        id={`issuanceLocation-${index}`}
                                                        className={styles.input}
                                                        value={traveler.issuanceLocation}
                                                        onChange={(event) =>
                                                            updateTraveler(index, "issuanceLocation", event.target.value)
                                                        }
                                                        placeholder="Mumbai"
                                                    />
                                                </div>
                                                <div className={styles.field}>
                                                    <label htmlFor={`issuanceDate-${index}`}>Issuance date</label>
                                                    <input
                                                        id={`issuanceDate-${index}`}
                                                        className={styles.input}
                                                        type="date"
                                                        value={traveler.issuanceDate}
                                                        onChange={(event) =>
                                                            updateTraveler(index, "issuanceDate", event.target.value)
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.fieldGridThree}>
                                                <div className={styles.field}>
                                                    <label htmlFor={`expiryDate-${index}`}>Expiry date</label>
                                                    <input
                                                        id={`expiryDate-${index}`}
                                                        className={styles.input}
                                                        type="date"
                                                        value={traveler.expiryDate}
                                                        onChange={(event) =>
                                                            updateTraveler(index, "expiryDate", event.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div className={styles.field}>
                                                    <label htmlFor={`issuanceCountry-${index}`}>Issuance country</label>
                                                    <input
                                                        id={`issuanceCountry-${index}`}
                                                        className={styles.input}
                                                        value={traveler.issuanceCountry}
                                                        onChange={(event) =>
                                                            updateTraveler(index, "issuanceCountry", event.target.value)
                                                        }
                                                        placeholder="IN"
                                                    />
                                                </div>
                                                <div className={styles.field}>
                                                    <label htmlFor={`validityCountry-${index}`}>Validity country</label>
                                                    <input
                                                        id={`validityCountry-${index}`}
                                                        className={styles.input}
                                                        value={traveler.validityCountry}
                                                        onChange={(event) =>
                                                            updateTraveler(index, "validityCountry", event.target.value)
                                                        }
                                                        placeholder="IN"
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.field}>
                                                <label htmlFor={`nationality-${index}`}>Nationality</label>
                                                <input
                                                    id={`nationality-${index}`}
                                                    className={styles.input}
                                                    value={traveler.nationality}
                                                    onChange={(event) =>
                                                        updateTraveler(index, "nationality", event.target.value)
                                                    }
                                                    placeholder="IN"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </section>

                                <div className={styles.notice}>
                                    This first Amadeus flow is set up for adult traveler
                                    booking details. If Amadeus production access or
                                    ticketing permissions are not enabled yet, the server
                                    will return the provider error directly here.
                                </div>

                                {bookingError && (
                                    <div className={styles.error}>
                                        <p className={styles.errorText}>{bookingError}</p>
                                    </div>
                                )}

                                <div className={styles.actions}>
                                    <div className={styles.actionText}>
                                        Review the live fare first. Booking uses the
                                        revalidated Amadeus offer, not the stale search card.
                                    </div>
                                    <button
                                        type="submit"
                                        className={styles.primaryButton}
                                        disabled={bookingLoading || pricingLoading || !pricing}
                                    >
                                        {bookingLoading ? "Booking with Amadeus..." : "Book with Amadeus"}
                                    </button>
                                </div>
                            </form>
                        </main>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}
