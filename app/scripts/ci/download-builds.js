#!/usr/bin/env node

/**
 * app/scripts/ci/download-builds.js
 *
 * Responsibilities:
 *  - Read build-manifest.json
 *  - Wait until every remote EAS build finishes
 *  - Download every finished artifact
 *  - Store artifacts inside .ci/artifacts
 *  - Update build-manifest.json with download information
 *
 * This script intentionally does NOT:
 *  - Rename artifacts
 *  - Generate release notes
 *  - Create GitHub releases
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "../..");

const CI_DIR = path.join(PROJECT_ROOT, ".ci");
const ARTIFACT_DIR = path.join(CI_DIR, "artifacts");

const MANIFEST_PATH = path.join(
    CI_DIR,
    "build-manifest.json"
);

const POLL_INTERVAL = 15000;

async function main() {
    ensureExists(MANIFEST_PATH);

    fs.mkdirSync(ARTIFACT_DIR, {
        recursive: true,
    });

    const manifest = JSON.parse(
        fs.readFileSync(MANIFEST_PATH, "utf8")
    );

    if (!Array.isArray(manifest.builds)) {
        throw new Error("Invalid build manifest.");
    }

    for (const build of manifest.builds) {
        await waitForBuild(build);
        await downloadBuild(build);
    }

    fs.writeFileSync(
        MANIFEST_PATH,
        JSON.stringify(manifest, null, 4)
    );

    console.log("");
    console.log("All artifacts downloaded.");
}

async function waitForBuild(build) {
    console.log("");
    console.log(
        `Waiting for ${build.profile} (${build.id})...`
    );

    while (true) {
        const info = await getBuildInfo(build.id);

        build.status = info.status;

        process.stdout.write(
            `Status: ${info.status}                \r`
        );

        if (info.status === "FINISHED") {
            console.log("");
            return;
        }

        if (
            info.status === "ERRORED" ||
            info.status === "CANCELED"
        ) {
            throw new Error(
                `Build ${build.profile} ended with status ${info.status}.`
            );
        }

        await sleep(POLL_INTERVAL);
    }
}

async function downloadBuild(build) {
    console.log(`Downloading ${build.profile}...`);

    const extension = getExtension(build.platform);

    const outputFile = path.join(
        ARTIFACT_DIR,
        `${build.id}.${extension}`
    );

    await runCommand("eas", [
        "build:download",
        "--id",
        build.id,
        "--path",
        outputFile,
        "--non-interactive",
    ]);

    build.localFile = outputFile;
    build.extension = extension;

    console.log(`Saved -> ${outputFile}`);
}

async function getBuildInfo(id) {
    const output = await captureCommand("eas", [
        "build:view",
        "--build",
        id,
        "--json",
        "--non-interactive",
    ]);

    let parsed;

    try {
        parsed = JSON.parse(output);
    } catch {
        throw new Error(
            `Unable to parse build information for ${id}.`
        );
    }

    return parsed;
}

function getExtension(platform) {
    switch (platform) {
        case "android":
            return "apk"; // renamed later if actually an AAB

        case "ios":
            return "tar.gz"; // simulator archive / future ipa

        default:
            return "bin";
    }
}

function ensureExists(file) {
    if (!fs.existsSync(file)) {
        throw new Error(`Missing file:\n${file}`);
    }
}

function sleep(ms) {
    return new Promise((resolve) =>
        setTimeout(resolve, ms)
    );
}

function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: PROJECT_ROOT,
            shell: process.platform === "win32",
            stdio: "inherit",
        });

        child.on("error", reject);

        child.on("close", (code) => {
            if (code !== 0) {
                reject(
                    new Error(
                        `${command} exited with code ${code}`
                    )
                );
                return;
            }

            resolve();
        });
    });
}

function captureCommand(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: PROJECT_ROOT,
            shell: process.platform === "win32",
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (d) => {
            stdout += d.toString();
        });

        child.stderr.on("data", (d) => {
            stderr += d.toString();
        });

        child.on("error", reject);

        child.on("close", (code) => {
            if (code !== 0) {
                reject(
                    new Error(
                        stderr || `${command} failed`
                    )
                );
                return;
            }

            resolve(stdout.trim());
        });
    });
}

main().catch((err) => {
    console.error("");
    console.error(err);
    console.error("");
    process.exit(1);
});