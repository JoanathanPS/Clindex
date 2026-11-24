// Signed prescription tokens.
//
//   token = "CDX1." + b64url(deflate(canonicalJson(payload))) + "." + b64url(ed25519Sig)
//
// The signature covers the ASCII bytes "CDX1.<payload segment>" (JWS-style),
// so any change to any byte of the payload invalidates it. Verification needs
// only the prescriber's public key, so pharmacies can verify offline.

import { ed25519 } from "@noble/curves/ed25519.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { deflateSync, inflateSync } from "fflate";
import { b64url, canonicalJson, fromB64url, fromUtf8, utf8 } from "./codec";
import type { KeyDirectory, RxPayload } from "./types";

export const TOKEN_PREFIX = "CDX1";

export interface KeyPair {
  kid: string;
  secretKey: string; // base64url — keep on the doctor's device only
  publicKey: string; // base64url — published in the key directory
}

export function keyId(publicKey: Uint8Array): string {
  return b64url(sha256(publicKey)).slice(0, 16);
}

export function generateKeyPair(): KeyPair {
  const sk = ed25519.utils.randomSecretKey();
  const pk = ed25519.getPublicKey(sk);
  return { kid: keyId(pk), secretKey: b64url(sk), publicKey: b64url(pk) };
}

/** Salted hash of a patient identifier (e.g. phone or ABHA number). */
export function hashPatient(identifier: string, salt: string): string {
  return b64url(sha256(utf8(`${salt}:${identifier.trim().toLowerCase()}`))).slice(0, 22);
}

/** The compressed payload segment of a token. */
export function encodePayload(payload: RxPayload): string {
  return b64url(deflateSync(utf8(canonicalJson(payload)), { level: 9 }));
}

/**
 * Simulates a forger editing a signed prescription (e.g. 10x the quantity)
 * while keeping the original signature. Used by demos and tests.
 */
export function forgeQuantity(token: string, factor = 10): string | null {
  const payload = decodeRx(token);
  if (!payload) return null;
  const [prefix, , sig] = token.split(".");
  const forged: RxPayload = { ...payload, items: payload.items.map((it) => ({ ...it, qty: it.qty * factor })) };
  return `${prefix}.${encodePayload(forged)}.${sig}`;
}

export function signRx(payload: RxPayload, secretKey: string): string {
  const seg = encodePayload(payload);
  const sig = ed25519.sign(utf8(`${TOKEN_PREFIX}.${seg}`), fromB64url(secretKey));
  return `${TOKEN_PREFIX}.${seg}.${b64url(sig)}`;
}

export type VerifyFailure = "malformed" | "unknown_key" | "revoked_key" | "bad_signature" | "expired" | "not_yet_valid";

export type VerifyResult =
  | { ok: true; payload: RxPayload; prescriber: string }
  | { ok: false; reason: VerifyFailure; payload?: RxPayload };

/** Decodes without checking the signature (for display only). */
export function decodeRx(token: string): RxPayload | null {
  try {
    const [prefix, seg, sig] = token.trim().split(".");
    if (prefix !== TOKEN_PREFIX || !seg || !sig) return null;
    const payload = JSON.parse(fromUtf8(inflateSync(fromB64url(seg)))) as RxPayload;
    return payload?.v === 1 && Array.isArray(payload.items) ? payload : null;
  } catch {
    return null;
  }
}

export function verifyRx(token: string, directory: KeyDirectory, nowSeconds = Math.floor(Date.now() / 1000)): VerifyResult {
  const payload = decodeRx(token);
  if (!payload) return { ok: false, reason: "malformed" };
  const key = directory[payload.doc?.kid];
  if (!key) return { ok: false, reason: "unknown_key", payload };
  if (key.revoked) return { ok: false, reason: "revoked_key", payload };
  const [, seg, sig] = token.trim().split(".");
  let valid = false;
  try {
    valid = ed25519.verify(fromB64url(sig), utf8(`${TOKEN_PREFIX}.${seg}`), fromB64url(key.publicKey));
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, reason: "bad_signature", payload };
  if (nowSeconds < payload.iat - 300) return { ok: false, reason: "not_yet_valid", payload };
  if (nowSeconds > payload.exp) return { ok: false, reason: "expired", payload };
  return { ok: true, payload, prescriber: key.prescriber };
}
