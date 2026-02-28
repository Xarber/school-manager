const fs = require("fs");

const pkg = require("../package.json");
const projectRoot = process.cwd();

/*
============================
Expo app.json
============================
*/
const appJsonPath = projectRoot + "/app.json";
const appJson = require(appJsonPath);

appJson.expo.name = pkg.appName || pkg.name;
appJson.expo.slug = pkg.name;
appJson.expo.description = pkg.description || "";
appJson.expo.version = pkg.version;
appJson.expo.ios.bundleIdentifier = pkg.packageIdentifier;
appJson.expo.android.package = pkg.packageIdentifier;

fs.writeFileSync(
  appJsonPath,
  JSON.stringify(appJson, null, 2)
);

/*
============================
Tauri config
============================
*/

const tauriConfigPath = projectRoot + "/src-tauri/tauri.conf.json";
const tauriConfig = require(tauriConfigPath);

tauriConfig.productName = pkg.appName;
tauriConfig.version = pkg.version;

tauriConfig.identifier =
  pkg.packageIdentifier;

fs.writeFileSync(
  tauriConfigPath,
  JSON.stringify(tauriConfig, null, 2)
);

/*
============================
Cargo.toml
============================
*/

const cargoPath = projectRoot + "/src-tauri/Cargo.toml";
let cargo = fs.readFileSync(cargoPath, "utf8");

cargo = cargo.replace(
  /\nname = .*?\n/,
  `\nname = "${pkg.name}"\n`
);

cargo = cargo.replace(
  /\nversion = .*?\n/,
  `\nversion = "${pkg.version}"\n`
);

cargo = cargo.replace(
  /\nauthors = .*?\n/,
  `\nauthors = ["${pkg.author || ""}"]\n`
);

cargo = cargo.replace(
  /\ndescription = .*?\n/,
  `\ndescription = "${pkg.description || ""}"\n`
);

fs.writeFileSync(cargoPath, cargo);