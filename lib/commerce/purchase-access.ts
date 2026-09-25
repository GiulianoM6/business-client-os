import { createHmac, timingSafeEqual } from "node:crypto";
export function verifyShopifySignature(raw: Uint8Array, signature: string | null, secret: string | undefined): boolean {
 if (!secret || !signature || !/^[A-Za-z0-9+/]{43}=$/.test(signature)) return false;
 const received = Buffer.from(signature, "base64");
 const expected = createHmac("sha256",secret).update(raw).digest();
 return received.length === expected.length && timingSafeEqual(received,expected);
}

// Integration contract only. No browser or checkout redirect can mint an entitlement.
export type PurchaseAccess = { state:"verified"; purchaseId:string } | { state:"unverified"; reason:string };
export interface PurchaseAccessStore {
 // Implement with a dedicated verified purchase ledger, never workspace membership alone.
 forVerifiedUser(userId:string): Promise<PurchaseAccess>;
}
export const unconfiguredPurchaseAccess: PurchaseAccessStore = {
 async forVerifiedUser() { return {state:"unverified",reason:"Purchase verification is not configured."}; }
};
