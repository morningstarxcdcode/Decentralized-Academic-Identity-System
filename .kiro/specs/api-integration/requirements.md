# Requirements Document

## Introduction

This document specifies the requirements for integrating real backend services into the decentralized academic credential verification system. The integration will replace mock implementations with Firebase (authentication and user profiles), Alchemy (blockchain RPC for Polygon), and Pinata (IPFS pinning for permanent document storage). The system will also support users who don't have MetaMask by providing Firebase-based authentication as an alternative.

## Glossary

- **Firebase_Auth**: Firebase Authentication service for user login/signup and profile management
- **Alchemy_RPC**: Alchemy's blockchain RPC node service for interacting with Polygon network
- **Pinata_IPFS**: Pinata's IPFS pinning service for permanent decentralized file storage
- **Credential_System**: The core system that issues, stores, and verifies academic credentials
- **User_Profile**: User metadata including name, role, and wallet association stored in Firebase
- **DID**: Decentralized Identifier - a unique identifier for users in the system

## Requirements

### Requirement 1: Firebase Authentication Integration

**User Story:** As a user, I want to sign up and log in using email/password or Google authentication, so that I can access the system without requiring a MetaMask wallet.

#### Acceptance Criteria

1. WHEN a user visits the application without being logged in, THE Firebase_Auth SHALL display login/signup options
2. WHEN a user signs up with email and password, THE Firebase_Auth SHALL create a new account and store the user profile
3. WHEN a user logs in with valid credentials, THE Firebase_Auth SHALL authenticate the user and establish a session
4. WHEN a user logs in with Google OAuth, THE Firebase_Auth SHALL authenticate via Google and create/link the account
5. WHEN a user logs out, THE Firebase_Auth SHALL terminate the session and clear local state
6. IF authentication fails, THEN THE Firebase_Auth SHALL display an appropriate error message

### Requirement 2: User Profile Management

**User Story:** As a user, I want to manage my profile including my role and optional wallet address, so that the system knows my permissions and can link my blockchain identity.

#### Acceptance Criteria

1. WHEN a user completes registration, THE User_Profile SHALL store name, email, role, and creation timestamp in Firestore
2. WHEN a user selects a role (student, university, employer, government), THE User_Profile SHALL update the role in Firestore
3. WHEN a user connects a MetaMask wallet, THE User_Profile SHALL associate the wallet address with their account
4. WHEN a user views their profile, THE Credential_System SHALL retrieve and display profile data from Firestore
5. WHEN a user updates their profile, THE User_Profile SHALL persist changes to Firestore immediately

### Requirement 3: Pinata IPFS Integration

**User Story:** As a university, I want to upload credential documents to permanent decentralized storage, so that credentials are tamper-proof and always accessible.

#### Acceptance Criteria

1. WHEN a credential document is issued, THE Pinata_IPFS SHALL upload the document metadata to IPFS
2. WHEN uploading to IPFS, THE Pinata_IPFS SHALL return a valid CID (Content Identifier)
3. WHEN a credential is verified, THE Pinata_IPFS SHALL retrieve the document using its CID
4. WHEN uploading fails, THE Pinata_IPFS SHALL retry up to 3 times before reporting an error
5. THE Pinata_IPFS SHALL pin all uploaded content for permanent availability

### Requirement 4: Alchemy Blockchain RPC Integration

**User Story:** As a system administrator, I want the application to connect to Polygon network via Alchemy, so that blockchain transactions are reliable and fast.

#### Acceptance Criteria

1. WHEN the application initializes, THE Alchemy_RPC SHALL establish a connection to Polygon network
2. WHEN a credential is issued on-chain, THE Alchemy_RPC SHALL submit the transaction to Polygon
3. WHEN verifying a credential, THE Alchemy_RPC SHALL query the smart contract for credential data
4. WHEN a transaction is submitted, THE Alchemy_RPC SHALL return the transaction hash for tracking
5. IF the RPC connection fails, THEN THE Alchemy_RPC SHALL attempt reconnection with exponential backoff

### Requirement 5: Hybrid Authentication Support

**User Story:** As a user unfamiliar with crypto wallets, I want to use the system with just email login, so that I can receive and view my credentials without MetaMask.

#### Acceptance Criteria

1. WHEN a user logs in via Firebase without a wallet, THE Credential_System SHALL generate a custodial identifier for them
2. WHEN a Firebase-only user receives a credential, THE Credential_System SHALL store the credential reference in Firestore
3. WHEN a Firebase-only user later connects a wallet, THE Credential_System SHALL migrate their credentials to the wallet address
4. WHILE a user has no wallet connected, THE Credential_System SHALL allow viewing credentials but not on-chain operations

### Requirement 6: Environment Configuration

**User Story:** As a developer, I want API keys and configuration stored securely, so that sensitive credentials are not exposed in the codebase.

#### Acceptance Criteria

1. THE Credential_System SHALL load all API keys from environment variables
2. THE Credential_System SHALL validate required environment variables on startup
3. IF required environment variables are missing, THEN THE Credential_System SHALL display a configuration error
4. THE Credential_System SHALL use .env files for local development with .env.example as a template
