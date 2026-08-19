import json
import os
import sys
from pathlib import Path

import requests


REPO = os.environ["GITHUB_REPOSITORY"]
TOKEN = os.environ["GITHUB_TOKEN"]

TAG = os.environ["RELEASE_TAG"]
IPA_FILENAME = os.environ["IPA_FILENAME"]

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


# Read current source
with SOURCE_PATH.open("r", encoding="utf-8") as f:
    source = json.load(f)


# Get release information
release = github_api(
    f"/repos/{REPO}/releases/tags/{TAG}"
)

version = TAG.removeprefix("v")


# Find the iOS IPA
ipa_asset = next(
    (
        asset
        for asset in release["assets"]
        if asset["name"] == IPA_FILENAME
    ),
    None,
)

if ipa_asset is None:
    print(
        f"ERROR: Could not find IPA asset "
        f"{IPA_FILENAME} in release {TAG}"
    )
    sys.exit(1)


# Find School Manager
apps = source.setdefault("apps", [])

app = next(
    (
        app
        for app in apps
        if app.get("bundleIdentifier") == "com.xarber.schoolmanager"
    ),
    None,
)

if app is None:
    app = {
        "name": "School Manager",
        "bundleIdentifier": "com.xarber.schoolmanager",
        "developerName": "Xarber",
        "localizedDescription": "School Manager for iOS.",
        "tintColor": "#5d36c9",
    }
    apps.append(app)


# Update release information
app["version"] = version
app["downloadURL"] = ipa_asset["browser_download_url"]
app["iconURL"] = (
    "https://raw.githubusercontent.com/"
    f"{REPO}/master/"
    "app/assets/icons/icon-default/icon-default-light.png"
)


# Write only if something actually changed
new_contents = json.dumps(
    source,
    indent=2,
    ensure_ascii=False,
) + "\n"

old_contents = SOURCE_PATH.read_text(
    encoding="utf-8"
)

if new_contents == old_contents:
    print("No changes detected.")
    print("changes=false")
    sys.exit(0)


SOURCE_PATH.write_text(
    new_contents,
    encoding="utf-8"
)

print(f"Updated AltSource to {version}")
print(f"IPA: {ipa_asset['browser_download_url']}")
print("changes=true")