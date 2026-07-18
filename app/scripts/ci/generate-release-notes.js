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

    const buildInfo = readJson(BUILD_INFO_PATH);
    const manifest = readJson(MANIFEST_PATH);

    if (!Array.isArray(manifest.builds)) {
        throw new Error("Invalid build manifest: builds must be an array.");
    }

    const previousTag = findPreviousTag(buildInfo);
    const commits = getCommits(previousTag);
    const grouped = groupCommits(commits);

    const markdown = generateMarkdown(
        buildInfo,
        manifest,
        previousTag,
        grouped
    );

    fs.mkdirSync(path.dirname(OUTPUT_PATH), {
        recursive: true,
    });

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
    if (buildInfo.previousTag) {
        return buildInfo.previousTag;
    }

    const version = buildInfo.previousVersion;

    if (!version) {
        return null;
    }

    const branch = String(
        buildInfo.branch || ""
    ).toLowerCase();

    switch (branch) {
        case "development":
            return `v${version}-dev`;

        case "alpha":
            return `v${version}-alpha`;

        case "beta":
            return `v${version}-beta`;

        case "master":
            return `v${version}`;

        default:
            return null;
    }
}

function getCommits(previousTag) {
    const range =
        previousTag && tagExists(previousTag)
            ? `${previousTag}..HEAD`
            : "HEAD";

    const output = execFileSync(
        "git",
        [
            "log",
            range,
            "--pretty=format:%H%x09%s",
        ],
        {
            cwd: PROJECT_ROOT,
            encoding: "utf8",
        }
    ).trim();

    if (!output) {
        return [];
    }

    return output
        .split("\n")
        .filter(Boolean)
        .map((line) => {
            const separator = line.indexOf("\t");

            if (separator === -1) {
                return {
                    hash: "",
                    message: line.trim(),
                };
            }

            return {
                hash: line.slice(0, separator),
                message: line
                    .slice(separator + 1)
                    .trim(),
            };
        });
}

function tagExists(tag) {
    try {
        execFileSync(
            "git",
            [
                "rev-parse",
                "--verify",
                "--quiet",
                `refs/tags/${tag}`,
            ],
            {
                cwd: PROJECT_ROOT,
                stdio: "ignore",
            }
        );

        return true;
    } catch {
        return false;
    }
}

function groupCommits(commits) {
    const groups = {
        breaking: [],
        features: [],
        fixes: [],
        performance: [],
        refactor: [],
        docs: [],
        tests: [],
        build: [],
        ci: [],
        chores: [],
        style: [],
        revert: [],
        other: [],
    };

    for (const commit of commits) {
        const parsed = parseCommit(commit.message);

        const entry = formatCommitEntry(
            parsed.description,
            commit.hash
        );

        if (parsed.breaking) {
            groups.breaking.push(entry);
            continue;
        }

        switch (parsed.type) {
            case "feat":
                groups.features.push(entry);
                break;

            case "fix":
                groups.fixes.push(entry);
                break;

            case "perf":
                groups.performance.push(entry);
                break;

            case "refactor":
                groups.refactor.push(entry);
                break;

            case "docs":
                groups.docs.push(entry);
                break;

            case "test":
                groups.tests.push(entry);
                break;

            case "build":
                groups.build.push(entry);
                break;

            case "ci":
                groups.ci.push(entry);
                break;

            case "chore":
                groups.chores.push(entry);
                break;

            case "style":
                groups.style.push(entry);
                break;

            case "revert":
                groups.revert.push(entry);
                break;

            default:
                groups.other.push(entry);
        }
    }

    return groups;
}

function parseCommit(message) {
    const match = message.match(
        /^([a-z]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/i
    );

    if (!match) {
        return {
            type: null,
            scope: null,
            breaking: false,
            description: message,
        };
    }

    const [, type, scope, breakingMarker, description] =
        match;

    return {
        type: type.toLowerCase(),
        scope: scope || null,
        breaking: Boolean(breakingMarker),
        description: scope
            ? `**${scope}:** ${description}`
            : description,
    };
}

function formatCommitEntry(description, hash) {
    const shortHash = hash
        ? hash.slice(0, 7)
        : null;

    return shortHash
        ? `${description} (\`${shortHash}\`)`
        : description;
}

function generateMarkdown(
    buildInfo,
    manifest,
    previousTag,
    grouped
) {
    const out = [];

    const suffix = branchSuffix(buildInfo.branch);

    const displayVersion = suffix
        ? `${buildInfo.version}-${suffix}`
        : buildInfo.version;

    out.push(
        `# 🔨 ${buildInfo.appName} v${displayVersion}`
    );

    out.push("");

    out.push(
        "> Automated release generated by GitHub Actions."
    );

    out.push("");

    section(out, "💥 Breaking Changes", grouped.breaking);
    section(out, "🚀 Features", grouped.features);
    section(out, "🐛 Bug Fixes", grouped.fixes);
    section(out, "⚡️ Performance", grouped.performance);
    section(out, "♻️ Refactoring", grouped.refactor);
    section(out, "📝 Documentation", grouped.docs);
    section(out, "🧪 Tests", grouped.tests);
    section(out, "📦 Build System", grouped.build);
    section(out, "🤖 CI / Workflows", grouped.ci);
    section(out, "🧹 Maintenance", grouped.chores);
    section(out, "🎨 Code Style", grouped.style);
    section(out, "⏪ Reverts", grouped.revert);
    section(out, "📌 Other Changes", grouped.other);

    out.push("## 📋 Build Information");
    out.push("");
    out.push("| Property | Value |");
    out.push("| --- | --- |");
    out.push(
        `| Version | ${escapeTable(buildInfo.version)} |`
    );
    out.push(
        `| Previous Version | ${escapeTable(buildInfo.previousVersion || "-")} |`
    );
    out.push(
        `| Previous Tag | ${escapeTable(previousTag || "-")} |`
    );
    out.push(
        `| Runtime Version | ${escapeTable(buildInfo.runtimeVersion || "-")} |`
    );
    out.push(
        `| Branch | ${escapeTable(buildInfo.branch || "-")} |`
    );
    out.push(
        `| Commit | \`${buildInfo.shortCommit || String(buildInfo.commit || "").slice(0, 7)}\` |`
    );
    out.push(
        `| Build Date | ${escapeTable(buildInfo.buildDate || "-")} |`
    );

    out.push("");
    out.push("## 📦 Artifacts");
    out.push("");

    if (manifest.builds.length === 0) {
        out.push("- None");
    } else {
        for (const build of manifest.builds) {
            const filename =
                build.filename ??
                path.basename(build.localFile);

            out.push(
                `- **${String(build.platform).toUpperCase()}**`
            );

            out.push(
                `  - \`${filename}\``
            );

            if (build.profile) {
                out.push(
                    `  - Profile: \`${build.profile}\``
                );
            }

            out.push("");
        }
    }

    out.push("");

    return out.join("\n");
}

function section(out, title, entries) {
    if (entries.length === 0) {
        return;
    }

    out.push(`## ${title} (${entries.length})`);
    out.push("");

    for (const entry of entries) {
        out.push(`- ${entry}`);
    }

    out.push("");
}

function branchSuffix(branch) {
    switch (String(branch || "").toLowerCase()) {
        case "development":
            return "dev";

        case "alpha":
            return "alpha";

        case "beta":
            return "beta";

        case "master":
            return "";

        default:
            return slug(branch);
    }
}

function escapeTable(value) {
    return String(value)
        .replace(/\|/g, "\\|")
        .replace(/\r?\n/g, " ");
}

function slug(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}

function readJson(file) {
    try {
        return JSON.parse(
            fs.readFileSync(file, "utf8")
        );
    } catch (error) {
        throw new Error(
            `Unable to read JSON file:\n${file}\n\n${error.message}`
        );
    }
}

function ensureExists(file) {
    if (!fs.existsSync(file)) {
        throw new Error(
            `Missing file:\n${file}`
        );
    }
}

try {
    main();
} catch (error) {
    console.error("");
    console.error(error);
    console.error("");
    process.exit(1);
}