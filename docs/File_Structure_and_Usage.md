# 📂 File Structure & Usage Guide (DApp Architecture)

This document provides a technical map of the project, detailing how each component contributes to the decentralized ecosystem.

---

## **Root Components**

### `contracts/CredentialRegistry.sol`

**The Verifiable Data Registry.**
A Solidity smart contract that acts as the "Source of Truth." It records credential hashes, manages issuer accreditation (Government role), and provides immutable data for verification.

### `package.json`

**Dependency Manifest.**
Defines the technical environment, including `ethers` for blockchain interaction, `framer-motion` for high-end UI, and `lucide-react` for industrial icons.

---

## **Source Code (`/src`)**

### `contexts/BlockchainContext.jsx`

**The Core Middleware.**
Handles the connection between the React UI and the Ethereum/Polygon Virtual Machine. It manages wallet states (DIDs), authentication, and contract abstractions.

### `pages/`

- **`Landing.jsx`**: The Entry Point. Features cinematic onboarding and hero value propositions for each role.
- **`StudentDashboard.jsx`**: The Digital Wallet. Implements the "Holder" interface where users manage their VCs and generate QR proofs.
- **`UniversityPortal.jsx`**: The Issuance Terminal. Allows accredited institutions to sign data and anchor it to the ledger.
- **`VerifierPortal.jsx`**: The Trusted Gatekeeper. A low-friction tool for third parties to verify authenticity in real-time.
- **`GovernmentDashboard.jsx`**: The Accreditation Registry. For regulators to authorize or revoke university issuing permissions.

### `utils/mockIPFS.js`

**The Decentralized Storage Simulator.**
Mimics the behavior of IPFS CID generation and content-addressable storage for the current development simulation.

---

## **Design Systems (`/styles`)**

### `variables.css`

**The Token System.**
Contains the design tokens for the "Cinematic" UI, including HSL color palettes, glassmorphism filters, and dynamic typography settings.

### `global.css`

**Baseline Styles.**
Sets the foundation for responsive layouts, smooth scroll behavior, and global reset rules.
