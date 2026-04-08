const fs = require("fs");
const path = require("path");

const LOCALES_DIR = "./locales";
const BASE_LOCALE = process.argv[2] || "en.json"; // lingua di riferimento

const basePath = path.join(LOCALES_DIR, BASE_LOCALE);
const base = JSON.parse(fs.readFileSync(basePath, "utf8"));

const promptUser = async (message) => {
    const stdin = process.openStdin();
    return new Promise((resolve) => {
        stdin.once("data", (data) => {
            resolve(data.toString().trim());
        });
        process.stdout.write(message);
    });
};

const files = fs
  .readdirSync(LOCALES_DIR)
  .filter(f => f.endsWith(".json") && f !== BASE_LOCALE);

async function merge(target, source, fileName, currentPath = "") {
    let changes = 0;
    for (const key of Object.keys(source)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;

        if (!(key in target)) {
            const userValue = await promptUser(
                `[${BASE_LOCALE} -> ${fileName}] Found update: ${newPath}\n${JSON.stringify(source[key], null, 4)}\nEnter new value: `
            );

            target[key] = userValue || `[PENDINGUPDATE] ${source[key]}`;
            changes++;

            console.log(
                `[${fileName}] Added ${newPath} from ${BASE_LOCALE}`
            );

            continue;
        }

        if (
            typeof target[key] === "object" &&
            target[key] !== null &&
            typeof source[key] === "object" &&
            source[key] !== null &&
            !Array.isArray(target[key]) &&
            !Array.isArray(source[key])
        ) {
            changes = changes + await merge(target[key], source[key], fileName, newPath);
        }
    }
  return changes;
}

async function run() {
    for (const file of files) {
        const filePath = path.join(LOCALES_DIR, file);
        const json = JSON.parse(fs.readFileSync(filePath, "utf8"));

        let changes = await merge(json, base, file);
        if (changes === 0) console.log(`✔ Up to date: [${file}]`);
        else console.log(`✔ Updated: [${file}]`);

        fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
    }

    console.log("\n✔ Locale sync complete");
}

run().then(() => process.exit(0));