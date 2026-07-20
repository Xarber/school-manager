import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";

export type PasskeyLoginResult = {
  success: true;
  action: "login";
  token: string;
  email: string;
  isNewUser: boolean;
};

type PasskeyAction = "add" | "login";

async function runPasskeyExchange(
  serverPath: string,
  action: PasskeyAction,
  token?: string,
) {
  if (action === "add" && !token) {
    throw new Error("You must be logged in to add a passkey");
  }

  const callbackUrl = AuthSession.makeRedirectUri({
    scheme: "schoolmanager",
    path: `passkeys/${action}`,
  });

  const verifierBytes = await Crypto.getRandomBytesAsync(32);
  const codeVerifier = Array.from(verifierBytes)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");

  const codeChallenge = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
  );

  const startResponse = await fetch(
    `${serverPath}/api/passkeys/exchange/start`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(action === "add" && token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      body: JSON.stringify({
        action,
        callbackUrl,
        codeChallenge,
      }),
    },
  );

  const startJson = await startResponse.json();

  if (!startResponse.ok || !startJson.success || !startJson.browserUrl) {
    throw new Error(
      startJson.error ?? "Could not start passkey authentication",
    );
  }

  const browserResult = await WebBrowser.openAuthSessionAsync(
    startJson.browserUrl,
    callbackUrl,
  );

  if (browserResult.type !== "success") {
    // The user closed or cancelled the browser.
    return null;
  }

  const resultUrl = new URL(browserResult.url);
  const exchangeCode = resultUrl.searchParams.get("exchangeCode");

  if (!exchangeCode) {
    throw new Error("Missing passkey result code");
  }

  const completeResponse = await fetch(
    `${serverPath}/api/passkeys/exchange/complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(action === "add" && token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      body: JSON.stringify({
        action,
        exchangeCode,
        codeVerifier,
      }),
    },
  );

  const completeJson = await completeResponse.json();

  if (!completeResponse.ok || !completeJson.success) {
    throw new Error(
      completeJson.error ?? "Could not complete passkey authentication",
    );
  }

  return completeJson;
}

export async function loginWithPasskey(
  serverPath: string,
): Promise<PasskeyLoginResult | null> {
  return runPasskeyExchange(
    serverPath,
    "login",
  ) as Promise<PasskeyLoginResult | null>;
}

export async function addPasskey(
  serverPath: string,
  token: string,
): Promise<boolean> {
  const result = await runPasskeyExchange(serverPath, "add", token);
  return result?.success === true;
}
