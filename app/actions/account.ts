"use server";

/**
 * Delegate-key registration.
 *
 * This is the piece that makes the whole thing a Walrus story rather than a
 * generic memory story: the STUDENT owns the MemWalAccount (their Enoki
 * zkLogin address), and this app is only a delegate they registered. Revoking
 * the delegate cuts the app off from their learning record, onchain, without
 * asking the app's permission.
 *
 * Revocation is FORWARD-ONLY. The key stops reading anything saved after the
 * revoke; entries already saved stay readable to that key until they are
 * re-encrypted. Say that plainly wherever the button appears.
 */

import { generateDelegateKey, addDelegateKey, removeDelegateKey } from "@mysten-incubation/memwal/account";

const packageId = () => process.env.MEMWAL_PACKAGE_ID!;
const registryId = () => process.env.MEMWAL_REGISTRY_ID!;

export async function registerThisApp(accountId: string, ownerPrivateKey: string) {
  const delegate = await generateDelegateKey();

  await addDelegateKey({
    packageId: packageId(),
    registryId: registryId(),
    accountId,
    publicKey: delegate.publicKey,
    label: "ExamAce",
    suiPrivateKey: ownerPrivateKey, // TODO(enoki): swap for an Enoki walletSigner + sponsored tx
  });

  // Store delegate.privateKey server-side, encrypted at rest, keyed by the
  // owner address. It must never reach the browser.
  return { suiAddress: delegate.suiAddress, privateKey: delegate.privateKey };
}

export async function revokeThisApp(accountId: string, publicKey: Uint8Array, ownerPrivateKey: string) {
  return removeDelegateKey({
    packageId: packageId(),
    registryId: registryId(),
    accountId,
    publicKey,
    suiPrivateKey: ownerPrivateKey, // TODO(enoki): Enoki walletSigner
  });
}
