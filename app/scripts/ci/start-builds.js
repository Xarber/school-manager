#!/usr/bin/env node

/**
 * app/scripts/ci/start-builds.js
 *
 * Responsibilities:
 *  - Read BuildInfo.json
 *  - Start all required EAS builds in parallel
 *  - Capture build IDs
 *  - Write build-manifest.json for later CI steps
 *
 * This script intentionally does NOT:
 *  - Wait for builds to finish
 *  - Download artifacts
 *  - Rename artifacts
 *  - Create releases
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const BUILD_INFO_PATH = path.join(
    PROJECT_ROOT,
    "constants",
    "BuildInfo.json"
);

const OUTPUT_DIR = path.join(PROJECT_ROOT, ".ci");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "build-manifest.json");

async function main() {
    ensureExists(BUILD_INFO_PATH);

    const buildInfo = JSON.parse(
        fs.readFileSync(BUILD_INFO_PATH, "utf8")
    );

    const profiles = Object.values(
        buildInfo.outputs || {}
    ).filter(Boolean);

    if (profiles.length === 0) {
        console.log("No build profiles requested.");
        process.exit(0);
    }

    fs.mkdirSync(OUTPUT_DIR, {
        recursive: true,
    });

    console.log("");
    console.log("Starting EAS builds...");
    console.log("");

    const uniqueProfiles = [...new Set(profiles)];

    const results = await Promise.all(
        uniqueProfiles.map(startBuild)
    );

    const manifest = {
        appName: buildInfo.appName,
        version: buildInfo.version,
        runtimeVersion: buildInfo.runtimeVersion,
        branch: buildInfo.branch,
        commit: buildInfo.commit,
        buildDate: buildInfo.buildDate,
        builds: results,
    };

    fs.writeFileSync(
        MANIFEST_PATH,
        JSON.stringify(manifest, null, 4)
    );

    console.log("");
    console.log(`Manifest written to ${MANIFEST_PATH}`);
}

function ensureExists(file) {
    if (!fs.existsSync(file)) {
        throw new Error(`Missing file:\n${file}`);
    }
}

function startBuild(profile) {
    return new Promise((resolve, reject) => {
        console.log(`→ ${profile}`);

        const args = [
            "build",
            "--profile",
            profile,
            "--non-interactive",
            "--json",
        ];

        const child = spawn("eas", args, {
            cwd: PROJECT_ROOT,
            shell: process.platform === "win32",
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (d) => {
            const text = d.toString();
            stdout += text;
            process.stdout.write(text);
        });

        child.stderr.on("data", (d) => {
            const text = d.toString();
            stderr += text;
            process.stderr.write(text);
        });

        child.on("error", reject);

        child.on("close", (code) => {
            if (code !== 0) {
                reject(
                    new Error(
                        `EAS build failed for profile "${profile}"\n\n${stderr}`
                    )
                );
                return;
            }

            let parsed;

            try {
                parsed = JSON.parse(stdout);
            } catch {
                reject(
                    new Error(
                        `Unable to parse JSON output from EAS for profile "${profile}".`
                    )
                );
                return;
            }

            resolve({
                profile,
                id: parsed.id,
                platform: parsed.platform,
                status: parsed.status,
                projectId: parsed.projectId,
                channel: parsed.channel ?? null,
            });
        });
    });
}

main().catch((err) => {
    console.error("");
    console.error(err);
    console.error("");
    process.exit(1);
});