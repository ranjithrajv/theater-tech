#!/usr/bin/env node
/**
 * Source Validation Script
 *
 * Validates source data quality across all screens:
 * - Checks every screen has at least 1 source
 * - Validates URLs are well-formed
 * - Flags screens with only listing-tier sources
 * - Reports staleness (last_verified > 6 months)
 * - Shows source quality distribution
 *
 * Usage: node scripts/validate-sources.mjs
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "public", "data", "all_cities_screens.json");

const STALE_MONTHS = 6;

/** Hostnames treated as directory/listing tier. */
const LISTING_HOSTS = [
    "bookmyshow.com", "paytm.com", "insider.in",
    "justdial.com", "sulekha.com", "yellowpages.in", "grotal.com",
    "google.com", "goo.gl", "maps.app.goo.gl",
    "linkedin.com", "glassdoor.com",
    "twitter.com", "x.com", "facebook.com", "instagram.com",
    "youtube.com", "reddit.com", "zomato.com",
];

const CHAIN_DOMAINS = [
    "pvr.in", "pvr cinemas.com", "inoxmovies.com", "inox.co.in",
    "cinepolis.in", "cinepolis.co.in", "carnivalcinemas.com",
    "vrcenters.com", "gopalan.com", "mantri.in",
    "prasadsofficial.com", "prasadsimax.com",
];

function classifyTier(url) {
    if (!url) return "secondary";
    let host;
    try {
        host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "secondary";
    }
    const lower = url.toLowerCase();
    if (LISTING_HOSTS.some(h => host === h || host.endsWith("." + h))) return "listing";
    if (CHAIN_DOMAINS.some(d => host === d || host.endsWith("." + d))) return "primary";
    return "secondary";
}

function isStale(lastVerified) {
    if (!lastVerified) return true;
    const parts = lastVerified.split("-");
    if (parts.length < 2) return true;
    const ver = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - STALE_MONTHS);
    return ver < threshold;
}

function main() {
    let screens;
    try {
        screens = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
    } catch (err) {
        console.error(`Failed to load data: ${err.message}`);
        process.exit(1);
    }

    console.log(`\nValidating sources for ${screens.length} screens...\n`);

    const stats = {
        total: screens.length,
        withSources: 0,
        withoutSources: 0,
        stale: 0,
        neverVerified: 0,
        onlyListing: 0,
        tiers: { primary: 0, secondary: 0, listing: 0 },
        totalSources: 0,
        invalidUrls: 0,
        cityBreakdown: {},
    };

    const issues = [];

    for (const screen of screens) {
        const city = screen.city || "Unknown";
        if (!stats.cityBreakdown[city]) {
            stats.cityBreakdown[city] = { total: 0, withSources: 0, stale: 0 };
        }
        stats.cityBreakdown[city].total++;

        const sources = screen.sources || [];
        if (sources.length === 0) {
            stats.withoutSources++;
            issues.push(`  [NO SOURCES] ${screen.name} (${city})`);
        } else {
            stats.withSources++;
            stats.cityBreakdown[city].withSources++;
        }

        stats.totalSources += sources.length;

        // Check tier distribution and URL validity
        const tiers = { primary: 0, secondary: 0, listing: 0 };
        for (const src of sources) {
            const tier = src.tier || classifyTier(src.url);
            tiers[tier]++;
            stats.tiers[tier]++;

            if (src.url) {
                try {
                    new URL(src.url);
                } catch {
                    stats.invalidUrls++;
                    issues.push(`  [INVALID URL] ${screen.name}: ${src.url}`);
                }
            }
        }

        // Flag screens with only listing-tier sources
        if (sources.length > 0 && tiers.primary === 0 && tiers.secondary === 0) {
            stats.onlyListing++;
            issues.push(`  [ONLY LISTING] ${screen.name} (${city}) — needs independent verification`);
        }

        // Check staleness
        const lastVerified = sources
            .map(s => s.last_verified)
            .filter(Boolean)
            .sort()[0];

        if (!lastVerified) {
            stats.neverVerified++;
            stats.stale++;
            stats.cityBreakdown[city].stale++;
            issues.push(`  [NEVER VERIFIED] ${screen.name} (${city})`);
        } else if (isStale(lastVerified)) {
            stats.stale++;
            stats.cityBreakdown[city].stale++;
            issues.push(`  [STALE] ${screen.name} (${city}) — last verified: ${lastVerified}`);
        }
    }

    // Print summary
    console.log("=== Source Quality Summary ===\n");
    console.log(`Total screens:      ${stats.total}`);
    console.log(`With sources:       ${stats.withSources}`);
    console.log(`Without sources:    ${stats.withoutSources}`);
    console.log(`Total sources:      ${stats.totalSources}`);
    console.log(`Invalid URLs:       ${stats.invalidUrls}`);
    console.log(`\nTier distribution:`);
    console.log(`  Primary:   ${stats.tiers.primary}`);
    console.log(`  Secondary: ${stats.tiers.secondary}`);
    console.log(`  Listing:   ${stats.tiers.listing}`);
    console.log(`\nStaleness:`);
    console.log(`  Never verified: ${stats.neverVerified}`);
    console.log(`  Stale (> ${STALE_MONTHS}mo):  ${stats.stale}`);
    console.log(`  Only listing:   ${stats.onlyListing}`);

    console.log(`\n--- By City ---`);
    for (const [city, data] of Object.entries(stats.cityBreakdown).sort()) {
        console.log(`  ${city}: ${data.total} screens, ${data.withSources} with sources, ${data.stale} stale`);
    }

    if (issues.length > 0) {
        console.log(`\n=== Issues (${issues.length}) ===\n`);
        for (const issue of issues) {
            console.log(issue);
        }
    } else {
        console.log("\n✅ No issues found.\n");
    }

    // Exit with error if critical issues
    const hasCritical = stats.withoutSources > 0 || stats.neverVerified > 0;
    process.exit(hasCritical ? 1 : 0);
}

main();
