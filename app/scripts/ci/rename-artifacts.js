#!/usr/bin/env node

/**
 * app/scripts/ci/rename-artifacts.js
 *
 * Responsibilities:
 *  - Read BuildInfo.json
 *  - Read build-manifest.json
 *  - Detect the final artifact type
 *  - Rename every downloaded artifact
 *  * Update build-manifest.json with the final paths
 *
 * This script intentionally does NOT:
 *  - Download artifacts
 *  - Generate release notes
 *  - Upload GitHub releases
 */

const fs = require("fs");
const path = require("path");

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

function main() {
    ensureExists(BUILD_INFO_PATH);
    ensureExists(MANIFEST_PATH);

    const buildInfo = JSON.parse(
        fs.readFileSync(BUILD_INFO_PATH, "utf8")
    );

    const manifest = JSON.parse(
        fs.readFileSync(MANIFEST_PATH, "utf8")
    );

    for (const build of manifest.builds) {
        renameArtifact(buildInfo, build);
    }

    fs.writeFileSync(
        MANIFEST_PATH,
        JSON.stringify(manifest, null, 4)
    );

    console.log("");
    console.log("Artifacts renamed successfully.");
}

function renameArtifact(buildInfo, build) {
    if (!build.localFile) {
        throw new Error(
            `Build "${build.profile}" does not contain a downloaded artifact.`
        );
    }

    ensureExists(build.localFile);

    const extension = detectExtension(build);

    const finalName = buildFilename(
        buildInfo,
        build,
        extension
    );

    const finalPath = path.join(
        path.dirname(build.localFile),
        finalName
    );

    if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
    }

    fs.renameSync(build.localFile, finalPath);

    build.localFile = finalPath;
    build.filename = finalName;
    build.extension = extension;

    console.log(
        `${path.basename(build.localFile)}`
    );
}

function detectExtension(build) {
    const current = path.extname(build.localFile).toLowerCase();

    if (current === ".apk") {
        if (
            build.profile.toLowerCase().includes("aab")
        ) {
            return "aab";
        }

        return "apk";
    }

    if (current === ".aab") {
        return "aab";
    }

    if (current === ".ipa") {
        return "ipa";
    }

    if (
        build.localFile.toLowerCase().endsWith(".tar.gz")
    ) {
        return "tar.gz";
    }

    if (
        build.profile
            .toLowerCase()
            .includes("simulator")
    ) {
        return "tar.gz";
    }

    return build.extension || "bin";
}

function buildFilename(
    buildInfo,
    build,
    extension
) {
    const appName = slug(buildInfo.appName);

    const version = buildInfo.version;

    const suffix = branchSuffix(buildInfo.branch);

    let name = `${appName}-v${version}`;

    if (suffix) {
        name += `-${suffix}`;
    }

    return `${name}.${extension}`;
}

function branchSuffix(branch) {
    switch ((branch || "").toLowerCase()) {
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

function slug(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+/g, "")
        .replace(/-+$/g, "");
}

function ensureExists(file) {
    if (!fs.existsSync(file)) {
        throw new Error(`Missing file:\n${file}`);
    }
}

main();