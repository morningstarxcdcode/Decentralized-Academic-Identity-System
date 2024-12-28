// Credential verification and caching service for OpenCampus integration
// Implements time-efficient lookup with memory-based cache (24-hour TTL)
// Reduces API calls by storing previously verified credentials

// Cache validity window - balances freshness with API load reduction
const CACHE_VALIDITY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const verificationCache = new Map();

// Enumeration for credential verification outcomes
export const VerificationStatus = {
  VERIFIED: 'verified',
  INVALID: 'invalid',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  NOT_FOUND: 'not_found',
  PENDING: 'pending',
  ERROR: 'error'
};

// Academic achievement classification types
export const AchievementType = {
  ACHIEVEMENT: 'Achievement',
  BADGE: 'Badge',
  CERTIFICATE: 'Certificate',
  DIPLOMA: 'Diploma',
  DEGREE: 'Degree'
};

// Main verification entry point - handles cache lookup and API calls
// Time complexity: O(1) for cache hit, O(1) for API call
export const verifyCredential = async (verificationRequest) => {
  const { credentialId, ocId, transactionHash } = verificationRequest;
  
  // Validate input parameters
  if (!credentialId && !transactionHash) {
    return {
      isValid: false,
      status: VerificationStatus.ERROR,
      error: 'Credential identifier or transaction hash is required',
      verificationTimestamp: new Date()
    };
  }

  // Use credential ID as cache key
  const lookupKey = credentialId || transactionHash;
  
  // Check cached results first
  const cachedVerification = getCachedResult(lookupKey);
  if (cachedVerification) {
    return {
      ...cachedVerification,
      fromCache: true
    };
  }

  try {
    // Perform actual verification logic
    const verificationResult = await performVerification(credentialId, ocId, transactionHash);
    
    // Store successful result in cache
    cacheResult(lookupKey, verificationResult);
    
    return verificationResult;
  } catch (err) {
    console.error('Credential verification error:', err);
    return {
      isValid: false,
      status: VerificationStatus.ERROR,
      error: err.message || 'Verification failed',
      verificationTimestamp: new Date()
    };
  }
};

// Core verification logic - validates credential format and returns result
// Time complexity: O(1) regex matching + async API delay simulation
const performVerification = async (credentialId, ocId, transactionHash) => {
  // Simulate network latency
  await new Promise(delayCallback => setTimeout(delayCallback, 500));
  
  // Validate credential identifier format
  if (credentialId) {
    const hexHashPattern = /^(0x)?[a-fA-F0-9]{64}$/;
    const alphanumericPattern = /^[a-zA-Z0-9-_]{10,}$/;
    const isValidCredentialFormat = hexHashPattern.test(credentialId) || 
                                    alphanumericPattern.test(credentialId);
    
    if (!isValidCredentialFormat) {
      return {
        isValid: false,
        status: VerificationStatus.INVALID,
        error: 'Credential identifier format is invalid',
        verificationTimestamp: new Date()
      };
    }
  }

  // Construct mock credential response (production would query OpenCampus API)
  const credentialData = {
    id: credentialId || transactionHash,
    name: 'Bachelor of Computer Science',
    description: 'Successfully completed Computer Science academic program requirements',
    issuer: {
      name: 'Demo University',
      ocId: 'did:ocid:demo-university',
      verified: true
    },
    holder: {
      name: 'Demo Student',
      ocId: ocId || 'did:ocid:demo-student'
    },
    issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    expiresAt: null,
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
    credential: credentialData,
    verificationTimestamp: new Date(),
    blockchainProof: transactionHash ? {
      transactionHash,
      blockNumber: 12345678,
      network: 'EDU Chain'
    } : null
  };
};

// Fetch all credentials associated with an OpenCampus identity
// Time complexity: O(1) for mock implementation, O(n) for real API
export const getCredentialsByOCID = async (ocidValue) => {
  if (!ocidValue) {
    return [];
  }

  try {
    // Simulate API latency
    await new Promise(delayCallback => setTimeout(delayCallback, 300));
    
    // Return sample credentials (production would call OpenCampus API)
    return [
      {
        isValid: true,
        status: VerificationStatus.VERIFIED,
        credential: {
          id: 'cred-001',
          name: 'Bachelor of Computer Science',
          issuer: { name: 'Demo University', verified: true },
          issuedAt: new Date('2024-05-15'),
          achievementType: AchievementType.DEGREE
        }
      },
      {
        isValid: true,
        status: VerificationStatus.VERIFIED,
        credential: {
          id: 'cred-002',
          name: 'AWS Cloud Practitioner',
          issuer: { name: 'Amazon Web Services', verified: true },
          issuedAt: new Date('2024-08-20'),
          achievementType: AchievementType.CERTIFICATE
        }
      }
    ];
  } catch (err) {
    console.error('Failed to retrieve credentials:', err);
    return [];
  }
};

// Store verification result with expiration timestamp
// Time complexity: O(1)
export const cacheResult = (credentialId, verificationResult) => {
  if (!credentialId || !verificationResult) return;
  
  verificationCache.set(credentialId, {
    result: verificationResult,
    cachedAt: Date.now(),
    expiresAt: Date.now() + CACHE_VALIDITY_DURATION_MS
  });
};

// Retrieve cached verification if not expired
// Time complexity: O(1)
export const getCachedResult = (credentialId) => {
  if (!credentialId) return null;
  
  const cacheEntry = verificationCache.get(credentialId);
  
  if (!cacheEntry) return null;
  
  // Check expiration - remove if stale
  if (Date.now() > cacheEntry.expiresAt) {
    verificationCache.delete(credentialId);
    return null;
  }
  
  return cacheEntry.result;
};

// Remove all cached entries
// Time complexity: O(1)
export const clearCache = () => {
  verificationCache.clear();
};

// Retrieve cache performance metrics
// Time complexity: O(n) where n is cache size
export const getCacheStats = () => {
  let validCount = 0;
  let expiredCount = 0;
  const currentTime = Date.now();
  
  verificationCache.forEach((entry) => {
    if (currentTime > entry.expiresAt) {
      expiredCount++;
    } else {
      validCount++;
    }
  });
  
  return {
    totalEntries: verificationCache.size,
    validEntries: validCount,
    expiredEntries: expiredCount,
    cacheTTLHours: CACHE_VALIDITY_DURATION_MS / (60 * 60 * 1000)
  };
};

// Convert verification status code to user-friendly display information
// Provides message, description, color hint, and icon suggestion
export const getStatusInfo = (statusCode) => {
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
        description: 'Verification process is in progress.',
        color: 'info',
        icon: 'loader'
      };
    default:
      return {
        message: 'Verification Error',
        description: 'An unexpected error occurred during verification.',
        color: 'error',
        icon: 'alert-triangle'
      };
  }
};

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
