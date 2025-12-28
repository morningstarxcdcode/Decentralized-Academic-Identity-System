# Implementation Plan: OpenCampus ID & Multi-Role Authentication Integration

## Overview

This implementation plan covers integrating OpenCampus ID for certificate verification and implementing an enhanced multi-role authentication system with email domain validation, protected routes, and password recovery.

## Tasks

- [x] 1. Set up project dependencies and configuration
  - [x] 1.1 Install OpenCampus ID SDK and testing dependencies
    - Install `@opencampus/ocid-connect-js` package
    - Install `fast-check` for property-based testing
    - Install `vitest` and `@testing-library/react` for testing
    - _Requirements: 8.1_

  - [x] 1.2 Create environment configuration template
    - Update `.env.example` with all required OCID and domain validation variables
    - Add configuration validation utility
    - _Requirements: 8.1, 8.2, 6.6_

- [x] 2. Implement Email Domain Validator service
  - [x] 2.1 Create email domain validator service
    - Create `src/services/emailDomainValidator.js`
    - Implement domain pattern matching for university, government, admin roles
    - Implement role suggestion based on email domain
    - Load domain patterns from environment variables
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [ ] 2.2 Write property test for email domain validation
    - **Property 1: Email Domain Validation Correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

  - [ ] 2.3 Write property test for role suggestion
    - **Property 7: Role Suggestion from Email Domain**
    - **Validates: Requirements 4.4**

- [x] 3. Implement OpenCampus ID Service
  - [x] 3.1 Create OpenCampus ID service
    - Create `src/services/opencampusService.js`
    - Implement SDK initialization with sandbox/production modes
    - Implement sign-in, callback handling, and logout methods
    - Implement JWT token verification
    - _Requirements: 1.1, 8.1, 8.4_

  - [x] 3.2 Create OCID Context provider
    - Create `src/contexts/OCIDContext.jsx`
    - Wrap OCID service with React context
    - Manage OCID authentication state
    - Expose connection and verification methods
    - _Requirements: 1.1, 1.5_

- [x] 4. Implement Certificate Verification Service
  - [x] 4.1 Create certificate verification service
    - Create `src/services/certificateVerificationService.js`
    - Implement credential verification by ID/hash
    - Implement verification result caching with 24-hour TTL
    - Implement error handling for various failure modes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [ ] 4.2 Write property test for verification response handling
    - **Property 3: Credential Verification Response Handling**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [ ] 4.3 Write property test for verification cache behavior
    - **Property 5: Verification Cache Behavior**
    - **Validates: Requirements 1.6**

- [ ] 5. Checkpoint - Core services complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Enhance Authentication Context
  - [x] 6.1 Add password recovery methods to Firebase service
    - Add `sendPasswordResetEmail` function
    - Add `confirmPasswordReset` function
    - Update `src/services/firebaseService.js`
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [x] 6.2 Enhance AuthContext with role management
    - Add email domain validation on signup
    - Add role switching functionality
    - Add password recovery methods to context
    - Integrate OCID linking capability
    - Update `src/contexts/AuthContext.jsx`
    - _Requirements: 3.1, 3.3, 6.1_

  - [ ] 6.3 Write property test for session cleanup
    - **Property 6: Session Cleanup on Logout**
    - **Validates: Requirements 7.4**

- [x] 7. Implement Protected Route Component
  - [x] 7.1 Create ProtectedRoute component
    - Create `src/components/ProtectedRoute.jsx`
    - Implement authentication check with redirect
    - Implement role-based access control
    - Implement URL preservation for post-login redirect
    - Support multiple allowed roles per route
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 7.2 Write property test for route access control
    - **Property 2: Route Access Control Correctness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [ ] 7.3 Write property test for URL preservation
    - **Property 8: URL Preservation During Auth Redirect**
    - **Validates: Requirements 5.5**

- [ ] 8. Checkpoint - Auth system complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Update UI Components
  - [ ] 9.1 Enhance AuthModal with domain validation and password recovery
    - Add email domain validation feedback
    - Add "Forgot Password" link and modal
    - Add role suggestion based on email domain
    - Update error messages for domain validation
    - Update `src/components/AuthModal.jsx` and CSS
    - _Requirements: 2.5, 4.4, 6.1_

  - [ ] 9.2 Create OCID Connect button component
    - Create `src/components/OCIDConnectButton.jsx`
    - Style consistent with existing UI
    - Handle connection states (connecting, connected, error)
    - _Requirements: 1.1_

  - [ ] 9.3 Create Password Reset components
    - Create `src/components/ForgotPasswordModal.jsx`
    - Create `src/pages/ResetPassword.jsx` for reset link handling
    - Style consistent with existing AuthModal
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 10. Create Certificate Verification UI
  - [ ] 10.1 Create CertificateVerification component
    - Create `src/components/CertificateVerification.jsx`
    - Implement input field for credential ID/hash
    - Implement loading state during verification
    - Implement success/error result display
    - Style consistent with existing card components
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 10.2 Add QR code scanning support
    - Add QR scanner library integration
    - Implement camera permission handling
    - Parse QR code to extract credential ID
    - _Requirements: 9.5_

  - [ ] 10.3 Create verification result card component
    - Create `src/components/VerificationResultCard.jsx`
    - Display credential details (issuer, name, date, status)
    - Display blockchain proof information
    - Handle different verification statuses (valid, invalid, expired, revoked)
    - _Requirements: 1.2, 1.3, 9.3, 9.4_

- [ ] 11. Update Application Routing
  - [ ] 11.1 Wrap routes with ProtectedRoute component
    - Update `src/App.jsx` with protected routes
    - Configure role permissions for each route
    - Add OCID callback route
    - Add password reset route
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 11.2 Write property test for role-based navigation
    - **Property 4: Role-Based Navigation Correctness**
    - **Validates: Requirements 3.2, 3.4, 3.5**

- [ ] 12. Integrate OCID with existing pages
  - [ ] 12.1 Add OCID connection to profile page
    - Add OCID connect/disconnect button to EditProfile
    - Display linked OCID and ETH address
    - Update `src/pages/EditProfile.jsx`
    - _Requirements: 1.1_

  - [ ] 12.2 Add certificate verification to VerifierPortal
    - Integrate CertificateVerification component
    - Add verification history display
    - Update `src/pages/VerifierPortal.jsx`
    - _Requirements: 1.1, 9.1_

  - [ ] 12.3 Update Navbar with role-based navigation
    - Show/hide menu items based on user role
    - Add OCID connection status indicator
    - Update `src/components/Navbar.jsx`
    - _Requirements: 3.4_

- [ ] 13. Final checkpoint - Full integration complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all routes are properly protected
  - Test complete auth flows (signup, login, logout, password reset)
  - Test OCID connection and verification flows

## Notes

- All property-based tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use `fast-check` library with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The `@opencampus/ocid-connect-js` SDK provides React components for seamless integration
- Sandbox mode can be used for development without a Client ID
