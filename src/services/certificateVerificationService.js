/**
 * Certificate Verification Service
 * Handles credential verification against OpenCampus network with intelligent caching
 * Reduces API calls through a 24-hour time-to-live (TTL) cache
 * Performance: O(1) cache hits, O(1) API calls with async network delay
 */

// Cache configuration constants
const CACHE_VALIDITY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const verificationCache = new Map();

/**
 * Verification Status Enumeration
 * Defines all possible credential verification outcomes
 */
export const VerificationStatus = {
  VERIFIED: 'verified',
  INVALID: 'invalid',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  NOT_FOUND: 'not_found',
  PENDING: 'pending',
  ERROR: 'error'
};

/**
 * Academic Achievement Type Classification
 * Categorizes different types of academic credentials
 */
export const AchievementType = {
  ACHIEVEMENT: 'Achievement',
  BADGE: 'Badge',
  CERTIFICATE: 'Certificate',
  DIPLOMA: 'Diploma',
  DEGREE: 'Degree'
};

/**
 * Main Credential Verification Function
 * Entry point for credential validation against blockchain
 * Checks cache before making API calls for efficiency
 * Returns: { isValid, status, credential, verificationTimestamp, fromCache }
 */
async function initiateCredentialVerification(verificationRequest) {
  const { credentialId, ocId, transactionHash } = verificationRequest;
  
  // Require at least one identifying parameter
  if (!credentialId && !transactionHash) {
    return {
      isValid: false,
      status: VerificationStatus.ERROR,
      error: 'Please provide a credential ID or transaction hash for verification',
      verificationTimestamp: new Date()
    };
  }

  // Create cache key from primary identifier
  const cacheKey = credentialId || transactionHash;
  
  // Attempt cache retrieval first
  const cachedVerificationData = getCachedResult(cacheKey);
  if (cachedVerificationData) {
    return {
      ...cachedVerificationData,
      fromCache: true
    };
  }

  try {
    // Execute actual verification logic
    const verificationOutcome = await performCredentialValidation(
      credentialId, 
      ocId, 
      transactionHash
    );
    
    // Cache the successful result for future requests
    storeVerificationInCache(cacheKey, verificationOutcome);
    
    return verificationOutcome;
  } catch (verificationException) {
    console.error('Credential verification failed:', verificationException);
    return {
      isValid: false,
      status: VerificationStatus.ERROR,
      error: verificationException.message || 'Verification process encountered an error',
      verificationTimestamp: new Date()
    };
  }
}

/**
 * Core Verification Logic
 * Validates credential format and simulates API verification
 * Checks both hex hash and alphanumeric identifier patterns
 */
async function performCredentialValidation(credentialId, ocId, transactionHash) {
  // Simulate network latency for realistic behavior
  await new Promise(delayFunc => setTimeout(delayFunc, 500));
  
  // Validate credential identifier format if provided
  if (credentialId) {
    const hexHashPattern = /^(0x)?[a-fA-F0-9]{64}$/;
    const alphanumericPattern = /^[a-zA-Z0-9-_]{10,}$/;
    
    const isValidFormat = hexHashPattern.test(credentialId) || 
                         alphanumericPattern.test(credentialId);
    
    if (!isValidFormat) {
      return {
        isValid: false,
        status: VerificationStatus.INVALID,
        error: 'Credential identifier does not match expected format',
        verificationTimestamp: new Date()
      };
    }
  }

  // Build verified credential object (mock implementation)
  // In production, this would query the OpenCampus API or blockchain
  const verifiedCredentialDetails = {
    id: credentialId || transactionHash,
    name: 'Bachelor of Computer Science',
    description: 'Successfully completed all Bachelor of Science program requirements in Computer Science',
    issuer: {
      name: 'Academic Institution',
      ocId: 'did:ocid:university-001',
      verified: true
    },
    holder: {
      name: 'Credential Holder',
      ocId: ocId || 'did:ocid:student-holder'
    },
    issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    expiresAt: null, // Degrees don't expire
    achievementType: AchievementType.DEGREE,
    metadata: {
      major: 'Computer Science',
      gpa: '3.8',
      graduationYear: '2024'
    }
  };

  return {
    isValid: true,
    status: VerificationStatus.VERIFIED,
    credential: verifiedCredentialDetails,
    verificationTimestamp: new Date(),
    blockchainProof: transactionHash ? {
      transactionHash,
      blockNumber: 12345678,
      network: 'EDU Chain'
    } : null
  };
}

/**
 * Fetch Credentials by OpenCampus Identity
 * Retrieves all credentials associated with a specific OCID
 * Time complexity: O(1) for mock, O(n) for real API where n = credential count
 */
async function retrieveCredentialsByOpenCampusId(ocidValue) {
  if (!ocidValue) {
    return [];
  }

  try {
    // Simulate network request delay
    await new Promise(delayFunc => setTimeout(delayFunc, 300));
    
    // Return mock credentials (production would use OpenCampus API)
    return [
      {
        isValid: true,
        status: VerificationStatus.VERIFIED,
        credential: {
          id: 'cred-001',
          name: 'Bachelor of Computer Science',
          issuer: { name: 'Academic University', verified: true },
          issuedAt: new Date('2024-05-15'),
          achievementType: AchievementType.DEGREE
        }
      },
      {
        isValid: true,
        status: VerificationStatus.VERIFIED,
        credential: {
          id: 'cred-002',
          name: 'Cloud Architecture Certification',
          issuer: { name: 'Cloud Provider', verified: true },
          issuedAt: new Date('2024-08-20'),
          achievementType: AchievementType.CERTIFICATE
        }
      }
    ];
  } catch (retrievalError) {
    console.error('Failed to retrieve credentials by OCID:', retrievalError);
    return [];
  }
}

/**
 * Cache Management Functions
 */

function storeVerificationInCache(credentialKey, verificationData) {
  if (!credentialKey || !verificationData) {
    return;
  }
  
  verificationCache.set(credentialKey, {
    result: verificationData,
    cachedAt: Date.now(),
    expiresAt: Date.now() + CACHE_VALIDITY_DURATION_MS
  });
}

function getCachedResult(credentialKey) {
  if (!credentialKey) {
    return null;
  }
  
  const cacheEntry = verificationCache.get(credentialKey);
  
  if (!cacheEntry) {
    return null;
  }
  
  // Check if cache entry has expired
  if (Date.now() > cacheEntry.expiresAt) {
    verificationCache.delete(credentialKey);
    return null;
  }
  
  return cacheEntry.result;
}

function clearAllCachedResults() {
  verificationCache.clear();
}

function getVerificationCacheMetrics() {
  let activeCount = 0;
  let expiredCount = 0;
  const now = Date.now();
  
  verificationCache.forEach((entry) => {
    if (now > entry.expiresAt) {
      expiredCount++;
    } else {
      activeCount++;
    }
  });
  
  return {
    totalEntries: verificationCache.size,
    validEntries: activeCount,
    expiredEntries: expiredCount,
    cacheTTLHours: CACHE_VALIDITY_DURATION_MS / (60 * 60 * 1000)
  };
}

/**
 * Verification Status Display Information
 * Converts status codes to user-friendly UI information
 */
function getStatusDisplayInfo(statusCode) {
  switch (statusCode) {
    case VerificationStatus.VERIFIED:
      return {
        message: 'Credential Verified',
        description: 'This credential has been verified on the blockchain.',
        color: 'success',
        icon: 'check-circle'
      };
    case VerificationStatus.INVALID:
      return {
        message: 'Invalid Credential',
        description: 'This credential could not be verified.',
        color: 'error',
        icon: 'x-circle'
      };
    case VerificationStatus.EXPIRED:
      return {
        message: 'Credential Expired',
        description: 'This credential has passed its expiration date.',
        color: 'warning',
        icon: 'clock'
      };
    case VerificationStatus.REVOKED:
      return {
        message: 'Credential Revoked',
        description: 'This credential has been revoked by the issuer.',
        color: 'error',
        icon: 'ban'
      };
    case VerificationStatus.NOT_FOUND:
      return {
        message: 'Not Found',
        description: 'No credential found with this identifier.',
        color: 'warning',
        icon: 'search'
      };
    case VerificationStatus.PENDING:
      return {
        message: 'Verification Pending',
        description: 'Verification process is currently running.',
        color: 'info',
        icon: 'loader'
      };
    default:
      return {
        message: 'Verification Error',
        description: 'An unexpected error occurred during the verification process.',
        color: 'error',
        icon: 'alert-triangle'
      };
  }
}

// Export public API with clear names
export const verifyCredential = initiateCredentialVerification;
export const getCredentialsByOCID = retrieveCredentialsByOpenCampusId;
export const cacheResult = storeVerificationInCache;
export const getCachedResult = getCachedResult;
export const clearCache = clearAllCachedResults;
export const getCacheStats = getVerificationCacheMetrics;
export const getStatusInfo = getStatusDisplayInfo;

/**
 * Module Export
 * Public API for credential verification service
 */
export default {
  verifyCredential,
  getCredentialsByOCID,
  cacheResult,
  getCachedResult,
  clearCache,
  getCacheStats,
  getStatusInfo,
  VerificationStatus,
  AchievementType
};
