export interface RxItem {
  /** 1-based line number. */
  n: number;
  /** As written, e.g. "Dolo 650 Tablet" or "Paracetamol 650mg". */
  drug: string;
  /** Generic molecule names (for interaction checks and substitution). */
  generic: string[];
  /** Catalogue salt group, when known. */
  gid: number | null;
  /** Quantity authorised, in `unit`s. */
  qty: number;
  unit: string;
  /** Directions, e.g. "1 tablet twice daily after food for 5 days". */
  sig: string;
  /** Doctor forbids brand substitution. */
  noSub: boolean;
  /** Controlled class (opioid, benzodiazepine...) or null. */
  controlled: string | null;
}

export interface Prescriber {
  name: string;
  /** Registration number with the medical council. */
  reg: string;
  council: string;
  /** Signing key id. */
  kid: string;
}

export interface RxPayload {
  v: 1;
  id: string;
  /** Issued at / expires at (unix seconds). */
  iat: number;
  exp: number;
  doc: Prescriber;
  /** Salted patient hash: no plaintext identity in the QR. */
  pt: { h: string; age: number | null; sex: string | null };
  items: RxItem[];
}

export interface PublicKeyRecord {
  kid: string;
  publicKey: string; // base64url
  prescriber: string;
  revoked?: boolean;
}

export type KeyDirectory = Record<string, PublicKeyRecord>;
