import { query } from './db';

interface ScoreResult {
    score: number;
    label: string;
    data: Record<string, unknown>;
}

interface ConfidenceResult {
    weather: ScoreResult;
    safety: ScoreResult;
    scam: ScoreResult;
    crowd: ScoreResult;
    budget: ScoreResult;
    composite: number;
}

interface CitySafetyRow {
    crime_index: number | null;
    night_safety: number | null;
    police_presence: number | null;
    scam_density: number | null;
}

interface RegionalSafetyRow {
    civil_unrest_index: number | null;
    health_alerts: number | null;
}

interface SeasonalRiskRow {
    weather_risk_boost: number | null;
    event_risk_boost: number | null;
}

interface RiskHistoryRow {
    risk_score: number;
    recorded_at: string;
}

// Helper: convert raw index to 0-100 score
function toScore(value: number, inverse = false): number {
    const clamped = Math.min(Math.max(value, 0), 10);
    const score = inverse
        ? Math.round((1 - clamped / 10) * 100)
        : Math.round((clamped / 10) * 100);
    return score;
}

// Helper: get label from score
function getLabel(score: number): string {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 65) return 'GOOD';
    if (score >= 50) return 'MODERATE';
    if (score >= 35) return 'CAUTION';
    return 'HIGH RISK';
}

export async function calculateConfidenceScores(
    cityId: number,
    travelMonth: number,
    packageType: string = 'balanced'
): Promise<ConfidenceResult> {

    // Fetch all data in parallel from Postgres
    const [
        citySafetyRows,
        regionalRows,
        seasonalRows,
        riskHistoryRows,
    ] = await Promise.all([
        query<CitySafetyRow>(
            'SELECT * FROM city_safety_indices WHERE city_id = $1 LIMIT 1',
            [cityId]
        ),
        query<RegionalSafetyRow>(
            'SELECT * FROM regional_safety_indices LIMIT 1'
        ),
        query<SeasonalRiskRow>(
            "SELECT * FROM seasonal_risk_factors WHERE target_id = $1 AND target_type = 'CITY' AND month = $2 LIMIT 1",
            [cityId, travelMonth]
        ),
        query<RiskHistoryRow>(
            "SELECT risk_score, recorded_at FROM risk_history WHERE target_id = $1 AND target_type = 'CITY' ORDER BY recorded_at DESC LIMIT 30",
            [cityId]
        ),
    ]);

    const safety = citySafetyRows[0];
    const reg = regionalRows[0];
    const season = seasonalRows[0];
    const history = riskHistoryRows ?? [];

    // WEATHER SCORE
    const weatherBoost = season?.weather_risk_boost ?? 1.0;
    const weatherRawScore = weatherBoost <= 1.0 ? 90
        : weatherBoost <= 1.3 ? 75
            : weatherBoost <= 1.6 ? 55
                : 35;

    const weatherScore: ScoreResult = {
        score: weatherRawScore,
        label: getLabel(weatherRawScore),
        data: {
            month: travelMonth,
            weather_boost: weatherBoost,
            event_boost: season?.event_risk_boost ?? 1.0,
        }
    };

    // SAFETY SCORE
    const crimeIndex = safety?.crime_index ?? 5;
    const nightSafety = safety?.night_safety ?? 5;
    const policePresence = safety?.police_presence ?? 5;
    const civilUnrest = reg?.civil_unrest_index ?? 1;
    const healthAlerts = reg?.health_alerts ?? 0;

    const safetyRaw = Math.round(
        (toScore(10 - crimeIndex) * 0.35) +
        (toScore(nightSafety) * 0.25) +
        (toScore(policePresence) * 0.20) +
        (toScore(10 - civilUnrest) * 0.12) +
        (toScore(10 - healthAlerts) * 0.08)
    );

    const safetyScore: ScoreResult = {
        score: Math.min(safetyRaw, 100),
        label: getLabel(safetyRaw),
        data: {
            crime_index: crimeIndex,
            night_safety: nightSafety,
            police_presence: policePresence,
            civil_unrest: civilUnrest,
            health_alerts: healthAlerts,
        }
    };

    // SCAM SCORE (higher = safer)
    const scamDensity = safety?.scam_density ?? 3;
    const scamRaw = toScore(10 - scamDensity);

    // Apply trend: if scam rising recently, reduce score
    const recentScores = history.slice(0, 7).map((h) => h.risk_score);
    const avgRecent = recentScores.length
        ? recentScores.reduce((a: number, b: number) => a + b, 0) / recentScores.length
        : 5;
    const trendPenalty = avgRecent > 6 ? 10 : avgRecent > 4 ? 5 : 0;

    const scamFinal = Math.max(scamRaw - trendPenalty, 0);

    const scamScore: ScoreResult = {
        score: scamFinal,
        label: getLabel(scamFinal),
        data: {
            scam_density: scamDensity,
            trend_7day: avgRecent.toFixed(2),
            trend_penalty: trendPenalty,
        }
    };

    // CROWD SCORE
    const eventBoost = season?.event_risk_boost ?? 1.0;
    const crowdRaw = eventBoost <= 1.0 ? 88
        : eventBoost <= 1.1 ? 75
            : eventBoost <= 1.2 ? 60
                : 40;

    const crowdScore: ScoreResult = {
        score: crowdRaw,
        label: getLabel(crowdRaw),
        data: {
            event_boost: eventBoost,
            month: travelMonth,
            peak_season: eventBoost > 1.1,
        }
    };

    // BUDGET SCORE
    // Based on package type + city cost level
    const packageMultipliers: Record<string, number> = {
        comfort: 1.3,
        experience: 1.1,
        balanced: 1.0,
        explorer: 0.85,
        immersion: 0.80,
    };
    const multiplier = packageMultipliers[packageType] ?? 1.0;
    const budgetBase = 72;
    const budgetFinal = Math.min(
        Math.round(budgetBase / multiplier),
        100
    );

    const budgetScore: ScoreResult = {
        score: budgetFinal,
        label: getLabel(budgetFinal),
        data: {
            package_type: packageType,
            multiplier,
            value_rating: budgetFinal > 75 ? 'GOOD VALUE' : 'PREMIUM',
        }
    };

    // COMPOSITE (weighted average)
    const composite = Math.round(
        weatherScore.score * 0.15 +
        safetyScore.score * 0.35 +
        scamScore.score * 0.25 +
        crowdScore.score * 0.10 +
        budgetScore.score * 0.15
    );

    return {
        weather: weatherScore,
        safety: safetyScore,
        scam: scamScore,
        crowd: crowdScore,
        budget: budgetScore,
        composite,
    };
}

// Generate risk register from scores
export function generateRiskRegister(
    scores: ConfidenceResult,
    destinationName: string
): Array<{
    risk_title: string;
    risk_description: string;
    severity: string;
    category: string;
    prevention_steps: string[];
    sort_order: number;
}> {
    const risks = [];
    let order = 0;

    if (scores.scam.score < 65) {
        risks.push({
            risk_title: `Scam activity in ${destinationName}`,
            risk_description: `Scam density is above average.
        Tourist-targeted scams are commonly reported.`,
            severity: scores.scam.score < 40 ? 'HIGH' : 'MEDIUM',
            category: 'scam',
            prevention_steps: [
                'Use only app-based taxis (Grab, Uber, GO)',
                'Ignore unsolicited offers from strangers',
                'Book accommodation directly — avoid touts',
                'Keep copies of all booking confirmations',
            ],
            sort_order: order++,
        });
    }

    if (scores.safety.score < 70) {
        risks.push({
            risk_title: `Safety awareness required`,
            risk_description: `Exercise heightened awareness,
        particularly after dark.`,
            severity: scores.safety.score < 45 ? 'HIGH' : 'MEDIUM',
            category: 'safety',
            prevention_steps: [
                'Share your itinerary with someone at home',
                'Avoid displaying expensive items in public',
                'Use well-lit, busy routes after dark',
                'Save local emergency numbers: police + hospital',
            ],
            sort_order: order++,
        });
    }

    if (scores.weather.score < 65) {
        risks.push({
            risk_title: `Adverse weather risk this month`,
            risk_description: `Seasonal weather patterns may
        impact travel plans and outdoor activities.`,
            severity: scores.weather.score < 40 ? 'HIGH' : 'MEDIUM',
            category: 'weather',
            prevention_steps: [
                'Check daily forecasts via local weather app',
                'Book refundable accommodation where possible',
                'Pack appropriate rain / extreme weather gear',
                'Have indoor backup plans for key days',
            ],
            sort_order: order++,
        });
    }

    if (scores.crowd.score < 60) {
        risks.push({
            risk_title: `Peak season — high crowds expected`,
            risk_description: `This is a popular travel period.
        Expect premium pricing and queues.`,
            severity: 'LOW',
            category: 'crowd',
            prevention_steps: [
                'Pre-book all major attractions online',
                'Arrive at popular sites before 9am',
                'Book restaurants at least 2 days ahead',
                'Consider visiting secondary attractions',
            ],
            sort_order: order++,
        });
    }

    // Always add document risk
    risks.push({
        risk_title: 'Travel document checklist',
        risk_description: 'Ensure all documents are valid.',
        severity: 'LOW',
        category: 'docs',
        prevention_steps: [
            'Passport valid for 6+ months beyond return date',
            'Visa obtained and printed if required',
            'Travel insurance purchased and printed',
            'Digital copies stored in cloud storage',
            'Emergency contacts saved offline',
        ],
        sort_order: order++,
    });

    return risks;
}
