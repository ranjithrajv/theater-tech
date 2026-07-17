/**
 * Source Classification Module
 *
 * Classifies source URLs into credibility tiers and provides
 * display helpers for the verification system.
 *
 * Tier system (modeled after hyd-gcc):
 * - primary:   Official theater chain sites, press releases, official filings
 * - secondary: Independent news outlets, review sites, industry reports
 * - listing:   Booking platforms, directories, Google Maps (confirm presence only)
 */

/** @typedef {"primary" | "secondary" | "listing"} SourceTier */

/** Hostnames treated as directory/listing tier (presence, not verification). */
const LISTING_HOSTS = [
    "bookmyshow.com", "paytm.com", "insider.in",
    "justdial.com", "sulekha.com", "yellowpages.in", "grotal.com",
    "google.com", "goo.gl", "maps.app.goo.gl",
    "linkedin.com", "glassdoor.com",
    "twitter.com", "x.com", "facebook.com", "instagram.com",
    "youtube.com", "reddit.com",
    "zagat.com", "zomato.com",
];

/** Official theater chain domains → primary tier. */
const CHAIN_DOMAINS = [
    "pvr.in", "pvr cinemas.com", "inoxmovies.com", "inox.co.in",
    "cinepolis.in", "cinepolis.co.in", "carnivalcinemas.com",
    "mirrorNOW.com", "vrcenters.com", "forum.in",
    "gopalan.com", "mantri.in",
    "prasadsofficial.com", "prasadsimax.com",
    "elessardiamond.com", "lvr cinemas.com",
];

/** Official press / newsroom URL patterns → primary tier. */
const PRIMARY_HINTS = [
    "newsroom", "news.", "/news", "press", "media",
    "prnewswire", "businesswire", "newsfile",
];

/** Classify a source URL into a credibility tier.
 *  @param {string} url
 *  @returns {SourceTier}
 */
export function classifySource(url) {
    let host;
    try {
        host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "secondary";
    }
    const lower = url.toLowerCase();

    // Directory / booking platforms
    if (LISTING_HOSTS.some(h => host === h || host.endsWith("." + h))) {
        return "listing";
    }

    // Official theater chain domain
    if (CHAIN_DOMAINS.some(d => host === d || host.endsWith("." + d))) {
        return "primary";
    }

    // Careers/jobs pages are listing tier
    if (/(^|\.)careers?\.|\/careers|\/jobs|jobs\./.test(lower)) {
        return "listing";
    }

    // Press / newsroom patterns
    if (PRIMARY_HINTS.some(h => lower.includes(h))) {
        return "primary";
    }

    // Wikipedia with citations is secondary (not primary — it's aggregated)
    if (host === "wikipedia.org") {
        return "secondary";
    }

    // Indian news outlets → secondary
    const NEWS_HOSTS = [
        "timesofindia.com", "hindustantimes.com", "ndtv.com",
        "thehindu.com", "deccanherald.com", "deccanchronicle.com",
        "indianexpress.com", "scroll.in", "thequint.com",
        "filmcompanion.in", "screen.in", "boxofficeindia.com",
        "pinkvilla.com", "bollywoodhungama.com",
        "mathrubhumi.com", "manoramaonline.com",
        "the-news-minute.com", "thenewsminute.com",
        "bangaloremirror.com", "mumbamirror.com",
        "mid-day.com", "dna.india.com",
    ];
    if (NEWS_HOSTS.some(n => host.includes(n))) {
        return "secondary";
    }

    // Default: secondary
    return "secondary";
}

/**
 * Map legacy confidence values to tiers.
 * @param {string} confidence - "verified" | "verified (article)" | "estimated"
 * @returns {SourceTier}
 */
export function confidenceToTier(confidence) {
    switch (confidence) {
        case "verified": return "primary";
        case "verified (article)": return "secondary";
        case "estimated": return "listing";
        default: return "secondary";
    }
}

/**
 * Get tier for a source, preferring explicit tier field, falling back
 * to URL classification, then to confidence mapping.
 * @param {{ url?: string, tier?: SourceTier, confidence?: string }} source
 * @returns {SourceTier}
 */
export function getSourceTier(source) {
    if (source.tier) return source.tier;
    if (source.url) return classifySource(source.url);
    if (source.confidence) return confidenceToTier(source.confidence);
    return "secondary";
}

/** Tier display styling. */
export const TIER_STYLE = {
    primary: {
        label: "Primary",
        color: "#4ade80",
        bgClass: "source-tier-primary",
    },
    secondary: {
        label: "News",
        color: "#38bdf8",
        bgClass: "source-tier-secondary",
    },
    listing: {
        label: "Listing",
        color: "#94a3b8",
        bgClass: "source-tier-listing",
    },
};

/**
 * Render a single source as an HTML string.
 * @param {{ url?: string, publisher?: string, confidence?: string, tier?: SourceTier, published_date?: string, notes?: string }} source
 * @param {number} index
 * @returns {string} HTML string
 */
export function renderSource(source, index) {
    const tier = getSourceTier(source);
    const tierStyle = TIER_STYLE[tier];
    const publisher = source.publisher || "Unknown";
    const label = source.url
        ? truncate(publisher, 40)
        : publisher;
    const dateSuffix = source.published_date ? ` · ${source.published_date}` : "";

    if (!source.url) {
        return `
            <div class="source-item">
                <span class="source-publisher">${esc(publisher)}</span>
                <span class="source-date">${esc(dateSuffix)}</span>
                <span class="source-tier-badge ${tierStyle.bgClass}">${tierStyle.label}</span>
            </div>
        `;
    }

    return `
        <div class="source-item">
            <a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer"
               class="source-link" title="${esc(source.url)}">${esc(label)}</a>
            <span class="source-date">${esc(dateSuffix)}</span>
            <span class="source-tier-badge ${tierStyle.bgClass}">${tierStyle.label}</span>
        </div>
    `;
}

/**
 * Render the full sources section HTML.
 * @param {Array} sources
 * @returns {string} HTML string
 */
export function renderSourcesSection(sources) {
    if (!sources || sources.length === 0) {
        return `
            <div class="detail-section">
                <div class="detail-title">📚 Sources</div>
                <div class="source-empty">No sources documented</div>
            </div>
        `;
    }

    const items = sources.map((s, i) => renderSource(s, i)).join("");
    return `
        <div class="detail-section">
            <div class="detail-title">📚 Sources (${sources.length})</div>
            <div class="source-list">${items}</div>
        </div>
    `;
}

/**
 * Render a compact source count badge.
 * @param {Array} sources
 * @returns {string} HTML string
 */
export function renderSourceCountBadge(sources) {
    if (!sources || sources.length === 0) {
        return '<span class="source-count-badge source-count-none" title="No sources">0</span>';
    }

    const tiers = { primary: 0, secondary: 0, listing: 0 };
    sources.forEach(s => {
        const tier = getSourceTier(s);
        tiers[tier]++;
    });

    const tooltip = `Primary: ${tiers.primary} · News: ${tiers.secondary} · Listing: ${tiers.listing}`;
    return `<span class="source-count-badge" title="${esc(tooltip)}">${sources.length}</span>`;
}

/**
 * Check if a screen's verification data is stale (>6 months old).
 * @param {string|null} lastVerified - Date string in YYYY-MM or YYYY-MM-DD format
 * @returns {boolean} true if stale or missing
 */
export function isStale(lastVerified) {
    if (!lastVerified) return true;
    const parts = lastVerified.split("-");
    if (parts.length < 2) return true;
    const ver = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - 6);
    return ver < threshold;
}

/** Escape HTML entities. */
function esc(str) {
    if (str == null) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** Truncate a string to maxLen, adding ellipsis. */
function truncate(str, maxLen) {
    if (!str || str.length <= maxLen) return str;
    return str.slice(0, maxLen - 1) + "\u2026";
}

// Export for global access (non-module contexts)
if (typeof window !== "undefined") {
    window.SourceUtils = {
        classifySource,
        confidenceToTier,
        getSourceTier,
        isStale,
        TIER_STYLE,
        renderSource,
        renderSourcesSection,
        renderSourceCountBadge,
    };
}
