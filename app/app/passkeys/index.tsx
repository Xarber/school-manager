import { useState } from 'react';
import { useNetworkContext } from '@/constants/NetworkContext';
import { Platform } from 'react-native';
import {
    startRegistration,
    startAuthentication
} from "@simplewebauthn/browser";

export default function PasskeysPage() {
  const network = useNetworkContext();

  async function healthCheck() {
    if (Platform.OS !== 'web') return false; // Isn't running in browser
    if (typeof window === 'undefined' || typeof window.PublicKeyCredential === 'undefined') return false; // Passkeys unsupported
    if (!network.serverPath) return false; // Server not found

    try {
        const response = await fetch( `${network.serverPath}/api/passkeys/get`, {method: "POST"});
        if (!response.ok) return false; // Request failed

        const data: {
          data?: {
            available?: boolean;
            service?: string;
          }
        } = await response.json();

        if (!data.data?.available) return false; // Unavailable
        return true;
    } catch (error) {
      return false; // Errored (request failed)
    }
  }

  async function registerPasskey(token: string, name: string = "Passkey") {
    if (!network.serverPath) return false; // Server not ready

    // Get passkey options
    const optionsResponse = await fetch(`${network.serverPath}/api/passkeys/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "options",
      }),
    });
    const optionsJson = await optionsResponse.json();
    if (!optionsResponse.ok || !optionsJson.success) return false; // Request failed
    const { challengeId, data: options } = optionsJson;

    // Create the passkey
    const credential = await startRegistration({ optionsJSON: options });
    const verifyResponse = await fetch(`${network.serverPath}/api/passkeys/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "verify",
        challengeId,
        credential,
        name,
      })
    });
    const verifyJson = await verifyResponse.json();
    if (!verifyResponse.ok || !verifyJson.success) return false; // Verification failed

    return true; // Passkey registered
  }

  async function authenticatePasskey() {
    if (!network.serverPath) return false; // Server not ready
    
    // Get passkey options
    const optionsResponse = await fetch(`${network.serverPath}/api/passkeys/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "options",
      }),
    });
    const optionsJson = await optionsResponse.json();
    if (!optionsResponse.ok || !optionsJson.success) return false; // Request failed
    const { challengeId, data: options } = optionsJson;

    // Authenticate with the passkey
    const credential = await startAuthentication({ optionsJSON: options });
    const verifyResponse = await fetch(`${network.serverPath}/api/passkeys/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "verify",
        challengeId,
        credential,
      }),
    });
    const verifyJson = await verifyResponse.json();
    if (!verifyResponse.ok || !verifyJson.success) return false; // Verification failed

    return verifyJson; // Authenticated
  }
}