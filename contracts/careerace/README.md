# CareerAce Sovereign Credential — Sui Move Smart Contract

## Overview

The `sovereign_credential` module anchors Walrus Mainnet decentralized blob IDs and SHA-256 cryptographic digests directly into the Sui blockchain. This guarantees that candidate work histories, tailored CV versions, and certifications (e.g. STCW marine licenses, degree transcripts) cannot be forged, manipulated, or revoked by centralized platforms.

---

## Smart Contract Structs & Capabilities

- **`WorkCredentialAnchor`**: On-chain object binding a candidate sovereign address (`address`) to their immutable Walrus Blob ID (`String`), cryptographic digest (`String`), and credential type (`String`).
- **`SuiNSDomainAnchor`**: Binds a registered Sui Name Service domain (e.g., `candidate.sui`) directly to their primary Walrus resume snapshot.
- **Events**: Emits `CredentialAnchoredEvent` and `CredentialRevokedEvent` for indexing by Hubble, Indexer, or Sui RPC listeners.

---

## Deployment & Publishing Guide

### 1. Build and Verify Locally
```bash
cd contracts/careerace
sui move build
sui move test
```

### 2. Publish to Sui Mainnet (Production)
```bash
sui client publish \
  --gas-budget 100000000 \
  contracts/careerace
```

### 3. Register the Package ID
Once published, copy the resulting immutable `Package ID` and set it in your environment:
```bash
MEMWAL_PACKAGE_ID=<PUBLISHED_PACKAGE_ID>
SUI_CREDENTIAL_PACKAGE_ID=<PUBLISHED_PACKAGE_ID>
```

---

## Walrus Memory Sessions Track Notice

For the **Walrus Sessions: Chatbots That Remember** hackathon track:
- Evaluation relies on **Walrus Mainnet Memory** via `@mysten-incubation/memwal` (Agent ID: `0x434f860c828dc4320be447975b8283d7c5786c4a08b9ddc8f88540d9ea69aa00`, with 15 certified blobs on `relayer.memory.walrus.xyz`).
- This Move smart contract serves as an optional auxiliary on-chain credential registry that bridges classic Sui Move objects with Walrus blob storage.
