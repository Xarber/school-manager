#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const APP_CONFIG_PATH = "app/app.json";
const OUTPUT_PATH = "constants/BuildInfo.json";

function run(command) {
    return execSync(command, {
        encoding: "utf8"
    }).trim();
}

function getVersion(revision) {
    const output = run(`git show ${revision}:${APP_CONFIG_PATH}`);
    return JSON.parse(output).expo.version;
}

function getLatestTag(branch) {
    try {
        const tags = run(
            "git tag --merged HEAD --sort=-version:refname"
        ).split("\n").filter(Boolean);

        const suffixes = {
            development: "-dev",
            alpha: "-alpha",
            beta: "-beta"
        };

        const suffix = suffixes[branch];

        if (suffix) {
            return tags.find(
                (tag) =>
                    tag.startsWith("v") &&
                    tag.endsWith(suffix)
            ) || null;
        }

        if (branch === "master") {
            return tags.find(
                (tag) =>
                    tag.startsWith("v") &&
                    !tag.includes("-")
            ) || null;
        }

        return null;
    } catch {
        return null;
    }
}

function getVersionFromTag(tag) {
    if (!tag) {
        return null;
    }

    try {
        return getVersion(tag);
    } catch {
        return null;
    }
}

function getCurrentBranch() {
    if (process.env.GITHUB_REF_NAME) {
        return process.env.GITHUB_REF_NAME;
    }

    if (process.env.EAS_BUILD_GIT_COMMIT_HASH) {
        try {
            return run("git branch --show-current");
        } catch {
            // Continue to the normal Git fallback.
        }
    }

    return run("git branch --show-current");
}

try {
    const branch = getCurrentBranch();

    const commit = run("git rev-parse HEAD");
    const shortCommit = run("git rev-parse --short HEAD");
    const commitMessage = run("git log -1 --pretty=%s");

    const currentVersion = getVersion("HEAD");

    const previousTag = getLatestTag(branch);

    const previousVersion = getVersionFromTag(previousTag);

    const versionChanged =
        previousVersion === null ||
        previousVersion !== currentVersion;

    const buildProfiles = {
        androidApk: null,
        androidAab: null,
        ios: null
    };

    if (branch === "development") {
        buildProfiles.androidApk = "development-client";
        buildProfiles.ios = "development-client";
    } else if (
        branch === "alpha" ||
        branch === "beta" ||
        branch === "master"
    ) {
        buildProfiles.androidApk = "release-apk";
        buildProfiles.ios = "release-ios-simulator";

        if (branch === "beta" || branch === "master") {
            buildProfiles.androidAab = "release-aab";
        }
    }

    const buildInfo = {
        appName: "School Manager",

        version: currentVersion,
        previousTag,
        previousVersion,

        runtimeVersion: currentVersion,
        versionChanged,

        branch,

        commit,
        shortCommit,
        commitMessage,

        buildDate: new Date().toISOString(),

        buildProfiles,

        outputs: {
            androidApkProfile: buildProfiles.androidApk,
            androidAabProfile: buildProfiles.androidAab,
            iosProfile: buildProfiles.ios
        },

        expoSdk: null,
        reactNative: null
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), {
        recursive: true
    });

    fs.writeFileSync(
        OUTPUT_PATH,
        `${JSON.stringify(buildInfo, null, 2)}\n`,
        "utf8"
    );

    console.log(
        `Build information written to ${OUTPUT_PATH}`
    );

    console.log(JSON.stringify(buildInfo, null, 2));

    if (versionChanged) {
        console.log(
            `Version changed from ${previousVersion ?? "none"} to ${currentVersion}.`
        );
    } else {
        console.log(
            `Version remains ${currentVersion}. Native builds can be skipped.`
        );
    }

    process.exit(0);
} catch (error) {
    console.error("Failed to generate build information.");

    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error(error);
    }

    process.exit(1);
}
