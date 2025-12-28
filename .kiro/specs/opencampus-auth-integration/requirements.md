# Requirements Document

## Introduction

This document specifies the requirements for integrating OpenCampus ID for certificate verification and implementing an enhanced multi-role authentication system. The integration will enable verification of academic credentials through OpenCampus ID's blockchain-based verification, implement role-based email domain access control, and enhance the existing authentication system with password recovery, protected routes, and secure session management.

## Glossary

- **OpenCampus_ID**: OpenCampus ID service for verifying academic credentials on the EDU Chain blockchain
- **Auth_System**: The authentication and authorization system managing user access
- **Role_Manager**: Component that manages user roles and permissions (student, university, government, admin)
- **Email_Domain_Validator**: Service that validates email domains against allowed patterns for each role
- **Session_Manager**: Component handling JWT token-based session management
- **Protected_Route**: Route component that restricts access based on authentication and role
- **Certificate_Verifier**: Service that verifies certificate authenticity using OpenCampus ID

## Requirements

### Requirement 1: OpenCampus ID Integration for Certificate Verification

**User Story:** As a verifier, I want to verify academic certificates using OpenCampus ID, so that I can confirm the authenticity of credentials on the blockchain.

#### Acceptance Criteria

1. WHEN a user submits a certificate for verification, THE Certificate_Verifier SHALL query OpenCampus ID API to validate the credential
2. WHEN OpenCampus ID returns a valid response, THE Certificate_Verifier SHALL display verification status with issuer details
3. WHEN a certificate is verified successfully, THE Certificate_Verifier SHALL show the credential metadata including institution, degree, and issuance date
4. IF OpenCampus ID verification fails, THEN THE Certificate_Verifier SHALL display an appropriate error message with failure reason
5. WHEN verifying a certificate, THE Certificate_Verifier SHALL display a loading state during the API call
6. THE Certificate_Verifier SHALL cache verification results for 24 hours to reduce API calls

### Requirement 2: Role-Based Email Domain Access Control

**User Story:** As a system administrator, I want to restrict login access based on email domains for specific roles, so that only authorized users from verified institutions can access role-specific portals.

#### Acceptance Criteria

1. WHEN a university user attempts to register, THE Email_Domain_Validator SHALL verify the email ends with an approved educational domain (.edu, .ac.*, or configured institution domains)
2. WHEN a government user attempts to register, THE Email_Domain_Validator SHALL verify the email ends with an approved government domain (.gov, .gov.*)
3. WHEN an admin user attempts to register, THE Email_Domain_Validator SHALL verify the email is in the configured admin whitelist
4. WHEN a student user registers, THE Auth_System SHALL allow any valid email address
5. IF email domain validation fails, THEN THE Auth_System SHALL display a specific error explaining the domain requirement
6. THE Email_Domain_Validator SHALL support configurable domain patterns stored in environment variables

### Requirement 3: Multi-Role Login System

**User Story:** As a user, I want to log in with my role-specific credentials, so that I can access the appropriate dashboard and features for my role.

#### Acceptance Criteria

1. WHEN a user logs in, THE Auth_System SHALL retrieve and validate their assigned role from the database
2. WHEN login is successful, THE Auth_System SHALL redirect the user to their role-specific dashboard
3. WHEN a user has multiple roles, THE Auth_System SHALL allow role switching without re-authentication
4. THE Auth_System SHALL display role-specific navigation and features based on the authenticated user's role
5. WHEN a user attempts to access a route outside their role permissions, THE Protected_Route SHALL redirect to their default dashboard

### Requirement 4: Google OAuth Integration Enhancement

**User Story:** As a user, I want to sign in quickly using my Google account, so that I can access the system without creating a new password.

#### Acceptance Criteria

1. WHEN a user clicks "Sign in with Google", THE Auth_System SHALL initiate Google OAuth flow
2. WHEN Google authentication succeeds for a new user, THE Auth_System SHALL prompt for role selection
3. WHEN Google authentication succeeds for an existing user, THE Auth_System SHALL log them in with their stored role
4. WHEN a Google user's email matches a role-restricted domain, THE Auth_System SHALL auto-suggest the appropriate role
5. IF Google OAuth fails, THEN THE Auth_System SHALL display a user-friendly error message

### Requirement 5: Protected Routes with Role-Based Access Control

**User Story:** As a system administrator, I want routes protected based on authentication and role, so that unauthorized users cannot access restricted areas.

#### Acceptance Criteria

1. WHEN an unauthenticated user accesses a protected route, THE Protected_Route SHALL redirect to the login page
2. WHEN an authenticated user accesses a route requiring a different role, THE Protected_Route SHALL redirect to an unauthorized page or their dashboard
3. THE Protected_Route SHALL support multiple allowed roles for shared routes
4. WHEN checking route access, THE Protected_Route SHALL verify both authentication status and role permissions
5. THE Protected_Route SHALL preserve the intended destination URL for post-login redirect

### Requirement 6: Password Recovery System

**User Story:** As a user, I want to recover my password if I forget it, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user clicks "Forgot Password", THE Auth_System SHALL display a password reset form
2. WHEN a user submits their email for password reset, THE Auth_System SHALL send a reset link via Firebase
3. WHEN a user clicks the reset link, THE Auth_System SHALL display a new password form
4. WHEN a user submits a new password, THE Auth_System SHALL update the password and confirm success
5. IF the reset email is not found, THEN THE Auth_System SHALL display a generic message (for security)
6. THE Auth_System SHALL expire password reset links after 1 hour

### Requirement 7: Secure Session Management

**User Story:** As a user, I want my session to be secure and persistent, so that I stay logged in safely across browser sessions.

#### Acceptance Criteria

1. WHEN a user logs in successfully, THE Session_Manager SHALL create a secure session with Firebase Auth
2. WHEN a session token expires, THE Session_Manager SHALL automatically refresh the token if the user is active
3. WHEN a user is inactive for 30 days, THE Session_Manager SHALL require re-authentication
4. WHEN a user logs out, THE Session_Manager SHALL invalidate the session and clear local storage
5. THE Session_Manager SHALL store session data securely using Firebase Auth persistence
6. WHEN detecting suspicious activity, THE Session_Manager SHALL force re-authentication

### Requirement 8: OpenCampus ID Configuration

**User Story:** As a developer, I want clear configuration requirements for OpenCampus ID integration, so that I can properly set up the verification service.

#### Acceptance Criteria

1. THE Certificate_Verifier SHALL load OpenCampus ID API credentials from environment variables
2. THE Certificate_Verifier SHALL validate required OpenCampus configuration on application startup
3. IF OpenCampus ID configuration is missing, THEN THE Certificate_Verifier SHALL display a configuration error in development mode
4. THE Certificate_Verifier SHALL support both testnet and mainnet OpenCampus ID endpoints
5. THE Certificate_Verifier SHALL include proper error handling for API rate limits

### Requirement 9: Certificate Verification UI

**User Story:** As a user, I want a clear and intuitive interface for verifying certificates, so that I can easily check credential authenticity.

#### Acceptance Criteria

1. WHEN viewing the verification interface, THE Certificate_Verifier SHALL display input fields for certificate ID or hash
2. WHEN verification is in progress, THE Certificate_Verifier SHALL show a loading animation consistent with the app's UI
3. WHEN verification succeeds, THE Certificate_Verifier SHALL display a success state with credential details in a card format
4. WHEN verification fails, THE Certificate_Verifier SHALL display an error state with actionable guidance
5. THE Certificate_Verifier SHALL support QR code scanning for certificate verification
6. THE Certificate_Verifier SHALL maintain visual consistency with the existing application design system

