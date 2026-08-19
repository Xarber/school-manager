import json
import os
import sys
from pathlib import Path

import requests


REPO = os.environ["GITHUB_REPOSITORY"]
TOKEN = os.environ["GITHUB_TOKEN"]

# When triggered by a release event, use that release.
# When manually dispatched, use the latest published release.
EVENT_RELEASE_TAG = os.environ.get("RELEASE_TAG", "").strip()

SOURCE_PATH = Path(".github/apps.json")

API = "https://api.github.com"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}


def github_api(path):
    response = requests.get(
        f"{API}{path}",
        headers=headers,
    )

    response.raise_for_status()
    return response.json()


def get_release(tag):
    return github_api(
        f"/repos/{REPO}/releases/tags/{tag}"
    )


def get_latest_release():
    releases = github_api(
        f"/repos/{REPO}/releases?per_page=100"
    )

    # GitHub returns releases newest-first, but explicitly ignore:
    # - drafts
    # - prereleases
    # - the permanent 0.0 AltSource release
    for release in releases:
        if release.get("draft"):
            continue

        if release.get("prerelease"):
            continue

        if release.get("tag_name") == "0.0":
            continue

        return release

    print("ERROR: No published School Manager release found.")
    sys.exit(1)


# ------------------------------------------------------------
# Determine which release we are updating to
# ------------------------------------------------------------

if EVENT_RELEASE_TAG:
    release = get_release(EVENT_RELEASE_TAG)
else:
    release = get_latest_release()

release_tag = release["tag_name"]

print(f"Using release: {release_tag}")


# ------------------------------------------------------------
# Read existing source
# ------------------------------------------------------------

with SOURCE_PATH.open("r", encoding="utf-8") as f:
    source = json.load(f)


# ------------------------------------------------------------
# Find IPA
# ------------------------------------------------------------

ipa_asset = next(
    (
        asset
        for asset in release.get("assets", [])
        if asset["name"].endswith(".ipa")
    ),
    None,
)

if ipa_asset is None:
    print(
        f"ERROR: No IPA asset found in release {release_tag}."
    )
    sys.exit(1)


ipa_url = ipa_asset["browser_download_url"]
ipa_size = ipa_asset["size"]


# ------------------------------------------------------------
# Release metadata
# ------------------------------------------------------------

version = release_tag.removeprefix("v")

published_at = release.get("published_at")

if not published_at:
    print(
        f"ERROR: Release {release_tag} has no published_at date."
    )
    sys.exit(1)


# ------------------------------------------------------------
# App metadata
# ------------------------------------------------------------

bundle_identifier = "com.xarber.schoolmanager"

icon_url = (
    "https://raw.githubusercontent.com/"
    f"{REPO}/master/"
    "app/assets/icons/icon-default/icon-default-light.png"
)


# ------------------------------------------------------------
# Find School Manager in source
# ------------------------------------------------------------

apps = source.setdefault("apps", [])

app = next(
    (
        item
        for item in apps
        if item.get("bundleIdentifier") == bundle_identifier
    ),
    None,
)


if app is None:
    app = {
        "name": "School Manager",
        "bundleIdentifier": bundle_identifier,
        "developerName": "Xarber",
    }

    apps.append(app)


# ------------------------------------------------------------
# Static app metadata
# ------------------------------------------------------------

app["name"] = "School Manager"
app["bundleIdentifier"] = bundle_identifier
app["developerName"] = "Xarber"
app["subtitle"] = "Manage your school life."
app["localizedDescription"] = "School Manager for iOS."
app["iconURL"] = icon_url
app["tintColor"] = "#5d36c9"


# ------------------------------------------------------------
# Version history
# ------------------------------------------------------------

versions = app.setdefault("versions", [])


new_version = {
    "version": version,
    "date": published_at,
    "size": ipa_size,
    "downloadURL": ipa_url,
    "localizedDescription": release.get(
        "body",
        "School Manager release."
    ),
}


# Replace an existing entry for the same version,
# otherwise add a new version.
existing_index = next(
    (
        index
        for index, item in enumerate(versions)
        if item.get("version") == version
    ),
    None,
)

if existing_index is not None:
    versions[existing_index] = new_version
else:
    versions.append(new_version)


# Sort newest → oldest.
# GitHub's release version isn't necessarily semver-safe,
# so use the published date.
versions.sort(
    key=lambda item: item.get("date", ""),
    reverse=True,
)


# ------------------------------------------------------------
# Write only when something actually changed
# ------------------------------------------------------------

new_contents = (
    json.dumps(
        source,
        indent=2,
        ensure_ascii=False,
    )
    + "\n"
)

old_contents = SOURCE_PATH.read_text(
    encoding="utf-8"
)

if new_contents == old_contents:
    print("No changes detected.")
    print("changes=false")
    sys.exit(0)


SOURCE_PATH.write_text(
    new_contents,
    encoding="utf-8",
)

print(f"Updated AltSource to {version}")
print(f"IPA: {ipa_url}")
print(f"Size: {ipa_size} bytes")
print(f"Date: {published_at}")
print("changes=true")