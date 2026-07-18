#!/usr/bin/env node

/**
 * app/scripts/ci/generate-release-notes.js
 *
 * Responsibilities:
 *  - Read BuildInfo.json
 *  - Read build-manifest.json
 *  - Read Conventional Commits since the previous tag
 *  - Generate release-notes.md
 *
 * This script intentionally does NOT:
 *  - Create GitHub releases
 *  - Upload assets
 *  - Rename artifacts
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "../..");

const BUILD_INFO_PATH = path.join(
    PROJECT_ROOT,
    "constants",
    "BuildInfo.json"
);

const MANIFEST_PATH = path.join(
    PROJECT_ROOT,
    ".ci",
    "build-manifest.json"
);

const OUTPUT_PATH = path.join(
    PROJECT_ROOT,
    ".ci",
    "release-notes.md"
);

function main() {
    ensureExists(BUILD_INFO_PATH);
    ensureExists(MANIFEST_PATH);

    const buildInfo = JSON.parse(
        fs.readFileSync(BUILD_INFO_PATH, "utf8")
    );

    const manifest = JSON.parse(
        fs.readFileSync(MANIFEST_PATH, "utf8")
    );

    const previousTag = findPreviousTag(buildInfo);

    const commits = getCommits(previousTag);

    const grouped = groupCommits(commits);

    const markdown = generateMarkdown(
        buildInfo,
        manifest,
        previousTag,
        grouped
    );

    fs.writeFileSync(
        OUTPUT_PATH,
        markdown,
        "utf8"
    );

    console.log(
        `Release notes written to ${OUTPUT_PATH}`
    );
}

function findPreviousTag(buildInfo) {
    const version = buildInfo.previousVersion;

    if (!version) {
        return null;
    }

    const branch = (buildInfo.branch || "").toLowerCase();

    switch (branch) {
        case "development":
            return `v${version}-dev`;

        case "alpha":
            return `v${version}-alpha`;

        case "beta":
            return `v${version}-beta`;

        default:
            return `v${version}`;
    }
}

function getCommits(previousTag) {
    let range;

    if (previousTag) {
        range = `${previousTag}..HEAD`;
    } else {
        range = "HEAD";
    }

    let output = "";

    try {
        output = execFileSync(
            "git",
            [
                "log",
                range,
                "--pretty=format:%H%x09%s"
            ],
            {
                cwd: PROJECT_ROOT,
                encoding: "utf8"
            }
        );
    } catch {
        output = execFileSync(
            "git",
            [
                "log",
                "--pretty=format:%H%x09%s"
            ],
            {
                cwd: PROJECT_ROOT,
                encoding: "utf8"
            }
        );
    }

    return output
        .split("\n")
        .filter(Boolean)
        .map((line) => {
            const [hash, ...rest] = line.split("\t");

            return {
                hash,
                message: rest.join("\t").trim()
            };
        });
}

function groupCommits(commits) {
    const groups = {
        features: [],
        fixes: [],
        performance: [],
        breaking: [],
        other: []
    };

    for (const commit of commits) {
        const msg = commit.message;

        if (msg.includes("!")) {
            groups.breaking.push(msg);
            continue;
        }

        if (/^feat($begin:math:text$\.\+$end:math:text$)?:/i.test(msg)) {
            groups.features.push(msg);
            continue;
        }

        if (/^fix($begin:math:text$\.\+$end:math:text$)?:/i.test(msg)) {
            groups.fixes.push(msg);
            continue;
        }

        if (
            /^perf($begin:math:text$\.\+$end:math:text$)?:/i.test(msg)
        ) {
            groups.performance.push(msg);
            continue;
        }

        groups.other.push(msg);
    }

    return groups;
}

function generateMarkdown(
    buildInfo,
    manifest,
    previousTag,
    grouped
) {
    const out = [];

    out.push(`# ${buildInfo.appName} ${buildInfo.version}`);
    out.push("");

    section(out, "Features", grouped.features);
    section(out, "Fixes", grouped.fixes);
    section(out, "Performance", grouped.performance);
    section(out, "Breaking Changes", grouped.breaking);
    section(out, "Other Changes", grouped.other);

    out.push("## Build Information");
    out.push("");

    out.push(`| Property | Value |`);
    out.push(`|----------|-------|`);
    out.push(`| Version | ${buildInfo.version} |`);
    out.push(`| Previous Version | ${buildInfo.previousVersion || "-"} |`);
    out.push(`| Previous Tag | ${previousTag || "-"} |`);
    out.push(`| Runtime Version | ${buildInfo.runtimeVersion} |`);
    out.push(`| Branch | ${buildInfo.branch} |`);
    out.push(`| Commit | ${buildInfo.shortCommit} |`);
    out.push(`| Build Date | ${buildInfo.buildDate} |`);

    out.push("");
    out.push("### Artifacts");
    out.push("");

    for (const build of manifest.builds) {
        out.push(
            `- ${build.filename || path.basename(build.localFile)}`
        );
    }

    out.push("");

    return out.join("\n");
}

function section(out, title, entries) {
    out.push(`## ${title}`);
    out.push("");

    if (entries.length === 0) {
        out.push("- None");
        out.push("");
        return;
    }

    for (const entry of entries) {
        out.push(`- ${entry}`);
    }

    out.push("");
}

function ensureExists(file) {
    if (!fs.existsSync(file)) {
        throw new Error(
            `Missing file:\n${file}`
        );
    }
}

main();