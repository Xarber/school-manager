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

export async function loginWithPasskey(
  serverPath: string,
): Promise<PasskeyLoginResult | null> {
  const callbackUrl = AuthSession.makeRedirectUri({
    scheme: "schoolmanager",
    path: "passkeys/login",
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
      },
      body: JSON.stringify({
        action: "login",
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
      },
      body: JSON.stringify({
        action: "login",
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

  return completeJson as PasskeyLoginResult;
}