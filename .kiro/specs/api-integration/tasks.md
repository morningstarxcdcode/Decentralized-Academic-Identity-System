# Implementation Plan: API Integration

## Overview

This plan implements Firebase authentication, Pinata IPFS, and Alchemy RPC integration in incremental steps. Each task builds on previous work, ensuring the application remains functional throughout development.

## Tasks

- [x] 1. Set up environment configuration and install dependencies
  - Create `.env.example` with all required environment variables
  - Create `.env` with actual API keys (gitignored)
  - Install Firebase, Pinata, and ethers dependencies
  - Create configuration validation utility
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 2. Implement Firebase configuration and initialization
  - [x] 2.1 Create `src/config/firebase.js` with Firebase app initialization
    - Initialize Firebase app with config from environment
    - Export auth and firestore instances
    - _Requirements: 6.1_

- [x] 3. Implement Firebase authentication service
  - [x] 3.1 Create `src/services/firebaseService.js` with auth methods
    - Implement signUp, signIn, signInWithGoogle, signOut
    - Implement onAuthStateChanged listener
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 3.2 Add Firestore user profile methods to firebaseService
    - Implement createUserProfile, getUserProfile, updateUserProfile
    - Implement addCredentialRef, getCredentialRefs for non-wallet users
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.2_

- [-] 4. Implement AuthContext for React state management
  - [x] 4.1 Create `src/contexts/AuthContext.jsx`
    - Implement auth state management with Firebase listener
    - Implement profile loading and caching
    - Expose signUp, signIn, signOut, updateProfile methods
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.4_

- [ ] 4.2 Write property test for profile persistence round-trip
    - **Property 3: Profile Persistence Round-Trip**
    - **Validates: Requirements 2.4, 2.5**

- [-] 5. Implement Pinata IPFS service
  - [x] 5.1 Create `src/services/pinataService.js`
    - Implement uploadJSON with JWT authentication
    - Implement fetchByCID via IPFS gateway
    - Implement retry logic for failed uploads
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 5.2 Write property test for IPFS upload round-trip
    - **Property 5: IPFS Upload Round-Trip**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 6. Implement Alchemy blockchain service
  - [x] 6.1 Create `src/services/alchemyService.js`
    - Initialize ethers provider with Alchemy RPC URL
    - Implement getProvider, getSigner, getContract methods
    - Implement network info and block number queries
    - _Requirements: 4.1, 4.3_

- [-] 7. Update BlockchainContext to use real services
  - [x] 7.1 Refactor `src/contexts/BlockchainContext.jsx`
    - Replace mockIPFS with pinataService
    - Add Alchemy provider integration
    - Integrate with AuthContext for user identity
    - Support both wallet and Firebase-only users
    - _Requirements: 3.1, 4.1, 5.1, 5.4_

- [ ] 7.2 Write property test for non-wallet user restrictions
    - **Property 9: Non-Wallet User Restrictions**
    - **Validates: Requirements 5.4**

- [ ] 8. Checkpoint - Ensure services are working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create authentication UI components
  - [x] 9.1 Create `src/components/AuthModal.jsx`
    - Implement login/signup form with email/password
    - Add Google sign-in button
    - Add role selection for new users
    - Handle and display auth errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [x] 9.2 Create `src/components/AuthModal.module.css`
    - Style auth modal consistent with existing design
    - _Requirements: 1.1_

- [x] 10. Update Navbar with auth integration
  - [x] 10.1 Modify `src/components/Navbar.jsx`
    - Add login/signup button for unauthenticated users
    - Show user profile dropdown when authenticated
    - Add wallet connect option in profile menu
    - _Requirements: 1.1, 2.3_

- [ ] 11. Update profile pages with Firebase data
  - [ ] 11.1 Modify `src/pages/Profile.jsx`
    - Load profile from Firestore instead of mock data
    - Display wallet connection status
    - Show credentials from both wallet and Firestore refs
    - _Requirements: 2.4, 5.2_

  - [ ] 11.2 Modify `src/pages/EditProfile.jsx`
    - Save profile changes to Firestore
    - Add wallet linking functionality
    - _Requirements: 2.2, 2.3, 2.5, 5.3_

- [ ] 12. Update credential issuance flow
  - [ ] 12.1 Modify `src/pages/UniversityPortal.jsx`
    - Use Pinata for document upload
    - Store credential hash in Firestore for non-wallet students
    - _Requirements: 3.1, 5.2_

- [ ] 13. Update credential verification flow
  - [ ] 13.1 Modify `src/pages/VerifierPortal.jsx`
    - Fetch credential data from Pinata IPFS
    - Query blockchain via Alchemy for on-chain verification
    - _Requirements: 3.3, 4.3_

- [x] 14. Wrap App with AuthProvider
  - [x] 14.1 Modify `src/App.jsx`
    - Add AuthProvider wrapping the application
    - Ensure proper provider nesting order
    - _Requirements: 1.1_

- [ ] 15. Final checkpoint - Full integration test
  - Ensure all tests pass, ask the user if questions arise.
  - Test complete flow: signup → profile → issue credential → verify

## Notes

- All tasks including property tests are required
- Firebase emulator can be used for local development testing
- Use Polygon Amoy testnet for blockchain testing (not mainnet)
- All API keys should be in `.env` and never committed to git
