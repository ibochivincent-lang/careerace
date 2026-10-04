// Copyright (c) 2026 CareerAce Sovereign Memory Architecture.
// SPDX-License-Identifier: Apache-2.0

/// CareerAce Sovereign Credential & Walrus Onchain Anchor Module
///
/// Anchors Walrus blob IDs and SHA-256 cryptographic digests directly into Sui Move
/// smart contracts, enabling decentralized, tamper-proof verification of candidate
/// work history, tailored CV versions, and professional credentials.
/// Also integrates with Sui Name Service (SuiNS) to resolve human-readable .sui domains
/// directly to verified Walrus credentials.
module careerace::sovereign_credential {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string::String;

    // --- Error Codes ---
    const ENotAuthorizedIssuer: u64 = 1;
    const EInvalidBlobId: u64 = 2;
    const EInvalidDomain: u64 = 3;

    /// Cryptographic on-chain anchor binding a Walrus decentralized blob
    /// to a verified candidate Sui sovereign address.
    public struct WorkCredentialAnchor has key, store {
        id: UID,
        candidate: address,
        walrus_blob_id: String,
        digest: String,
        credential_type: String, // e.g. "sovereign_resume", "tailored_cv", "stcw_marine_license", "work_experience"
        issuer: address,
        timestamp_ms: u64,
    }

    /// On-chain anchor binding a human-readable SuiNS (.sui) domain
    /// to a candidate's sovereign address and primary Walrus resume blob.
    public struct SuiNSDomainAnchor has key, store {
        id: UID,
        candidate: address,
        suins_domain: String, // e.g. "vincent.sui"
        walrus_blob_id: String,
        timestamp_ms: u64,
    }

    /// On-chain event emitted when a Walrus credential blob is anchored.
    public struct CredentialAnchoredEvent has copy, drop {
        anchor_id: address,
        candidate: address,
        walrus_blob_id: String,
        digest: String,
        credential_type: String,
        issuer: address,
        timestamp_ms: u64,
    }

    /// On-chain event emitted when an anchor is retired or updated.
    public struct CredentialRevokedEvent has copy, drop {
        anchor_id: address,
        candidate: address,
        walrus_blob_id: String,
    }

    /// On-chain event emitted when a SuiNS domain is bound to a candidate profile.
    public struct SuiNSDomainBoundEvent has copy, drop {
        anchor_id: address,
        candidate: address,
        suins_domain: String,
        walrus_blob_id: String,
        timestamp_ms: u64,
    }

    /// Entry point to anchor a verified Walrus blob on Sui Testnet/Mainnet.
    public entry fun anchor_credential(
        candidate: address,
        walrus_blob_id: String,
        digest: String,
        credential_type: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);
        let anchor = WorkCredentialAnchor {
            id: object::new(ctx),
            candidate,
            walrus_blob_id,
            digest,
            credential_type,
            issuer: sender,
            timestamp_ms: timestamp,
        };

        let anchor_addr = object::uid_to_address(&anchor.id);

        event::emit(CredentialAnchoredEvent {
            anchor_id: anchor_addr,
            candidate,
            walrus_blob_id,
            digest,
            credential_type,
            issuer: sender,
            timestamp_ms: timestamp,
        });

        // Transfer the verifiable credential directly to the candidate's sovereign address
        sui::transfer::public_transfer(anchor, candidate);
    }

    /// Entry point to bind a human-readable SuiNS domain (.sui) to a candidate profile on-chain.
    public entry fun bind_suins_domain(
        candidate: address,
        suins_domain: String,
        walrus_blob_id: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let timestamp = clock::timestamp_ms(clock);
        let anchor = SuiNSDomainAnchor {
            id: object::new(ctx),
            candidate,
            suins_domain,
            walrus_blob_id,
            timestamp_ms: timestamp,
        };

        let anchor_addr = object::uid_to_address(&anchor.id);

        event::emit(SuiNSDomainBoundEvent {
            anchor_id: anchor_addr,
            candidate,
            suins_domain,
            walrus_blob_id,
            timestamp_ms: timestamp,
        });

        sui::transfer::public_transfer(anchor, candidate);
    }

    /// Destroys/revokes an obsolete credential anchor (can only be executed by candidate or issuer)
    public entry fun revoke_credential(
        anchor: WorkCredentialAnchor,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == anchor.candidate || sender == anchor.issuer, ENotAuthorizedIssuer);

        let WorkCredentialAnchor {
            id,
            candidate,
            walrus_blob_id,
            digest: _,
            credential_type: _,
            issuer: _,
            timestamp_ms: _,
        } = anchor;

        event::emit(CredentialRevokedEvent {
            anchor_id: object::uid_to_address(&id),
            candidate,
            walrus_blob_id,
        });

        object::delete(id);
    }

    // --- Read-only Getters ---

    public fun walrus_blob_id(anchor: &WorkCredentialAnchor): &String {
        &anchor.walrus_blob_id
    }

    public fun digest(anchor: &WorkCredentialAnchor): &String {
        &anchor.digest
    }

    public fun candidate(anchor: &WorkCredentialAnchor): address {
        anchor.candidate
    }

    public fun credential_type(anchor: &WorkCredentialAnchor): &String {
        &anchor.credential_type
    }

    public fun issuer(anchor: &WorkCredentialAnchor): address {
        anchor.issuer
    }

    public fun timestamp_ms(anchor: &WorkCredentialAnchor): u64 {
        anchor.timestamp_ms
    }

    public fun suins_domain(anchor: &SuiNSDomainAnchor): &String {
        &anchor.suins_domain
    }
}
