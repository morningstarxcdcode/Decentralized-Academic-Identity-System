/**
 * Certificate Verification Service
 * 
 * Handles credential verification using OpenCampus ID and blockchain.
 * Implements caching with 24-hour TTL to reduce API calls.
 */

// Cache configuration
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const verificationCache = new Map();

/**
 * Verification status types
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
 * Achievement types
 */
export const AchievementType = {
  ACHIEVEMENT: 'Achievement',
  BADGE: 'Badge',
  CERTIFICATE: 'Certificate',
  DIPLOMA: 'Diploma',
  DEGREE: 'Degree'
};

/**
 * Verify a credential by ID or hash
 * @param {Object} request - Verification request
 * @param {string} request.credentialId - Credential hash or ID
 * @param {string} request.ocId - Holder's OCID (optional)
 * @param {string} request.transactionHash - Blockchain transaction hash (optional)
 * @returns {Promise<Object>} - Verification result
 */
export const verifyCredential = async (request) => {
  const { credentialId, ocId, transactionHash } = request;
  
  if (!credentialId && !transactionHash) {
    return {
      isValid: false,
      status: VerificationStatus.ERROR,
      error: 'Credential ID or transaction hash is required',
      verificationTimestamp: new Date()
    };
  }

  const cacheKey = credentialId || transactionHash;
  
  // Check cache first
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult) {
    return {
      ...cachedResult,
      fromCache: true
    };
  }

  try {
    // In production, this would call the OpenCampus ID API
    // For now, we'll simulate verification based on credential format
    const result = await performVerification(credentialId, ocId, transactionHash);
    
    // Cache the result
    cacheResult(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Verification error:', error);
    return {
      isValid: false,
      status: VerificationStatus.ERROR,
      error: error.message || 'Verification failed',
      verificationTimestamp: new Date()
    };
  }
};

/**
 * Perform the actual verification (simulated for now)
 * @private
 */
const performVerification = async (credentialId, ocId, transactionHash) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Validate credential ID format (should be a hash or valid ID)
  if (credentialId) {
    // Check if it looks like a valid hash (64 hex chars) or ID
    const isValidFormat = /^(0x)?[a-fA-F0-9]{64}$/.test(credentialId) || 
                          /^[a-zA-Z0-9-_]{10,}$/.test(credentialId);
    
    if (!isValidFormat) {
      return {
        isValid: false,
        status: VerificationStatus.INVALID,
        error: 'Invalid credential ID format',
        verificationTimestamp: new Date()
      };
    }
  }

  // For demo purposes, return a mock verified credential
  // In production, this would query the OpenCampus ID API
  const mockCredential = {
    id: credentialId || transactionHash,
    name: 'Bachelor of Computer Science',
    description: 'Awarded for successful completion of the Computer Science program',
    issuer: {
      name: 'Demo University',
      ocId: 'did:ocid:demo-university',
      verified: true
    },
    holder: {
      name: 'Demo Student',
      ocId: ocId || 'did:ocid:demo-student'
    },
    issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    expiresAt: null, // No expiration
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
    credential: mockCredential,
    verificationTimestamp: new Date(),
    blockchainProof: transactionHash ? {
      transactionHash,
      blockNumber: 12345678,
      network: 'EDU Chain'
    } : null
  };
};

/**
 * Get credentials for an OCID
 * @param {string} ocId - OpenCampus ID
 * @returns {Promise<Array>} - Array of credentials
 */
export const getCredentialsByOCID = async (ocId) => {
  if (!ocId) {
    return [];
  }

  try {
    // In production, this would query the OpenCampus ID API
    // For now, return mock data
    await new Promise(resolve => setTimeout(resolve, 300));
    
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
  } catch (error) {
    console.error('Failed to get credentials:', error);
    return [];
  }
};

/**
 * Cache a verification result
 * @param {string} credentialId - Cache key
 * @param {Object} result - Verification result to cache
 */
export const cacheResult = (credentialId, result) => {
  if (!credentialId || !result) return;
  
  verificationCache.set(credentialId, {
    result,
    cachedAt: Date.now(),
    expiresAt: Date.now() + CACHE_TTL_MS
  });
};

/**
 * Get cached verification result if valid
 * @param {string} credentialId - Cache key
 * @returns {Object|null} - Cached result or null if expired/not found
 */
export const getCachedResult = (credentialId) => {
  if (!credentialId) return null;
  
  const cached = verificationCache.get(credentialId);
  
  if (!cached) return null;
  
  // Check if cache has expired
  if (Date.now() > cached.expiresAt) {
    verificationCache.delete(credentialId);
    return null;
  }
  
  return cached.result;
};

/**
 * Clear the verification cache
 */
export const clearCache = () => {
  verificationCache.clear();
};

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
export const getCacheStats = () => {
  let validEntries = 0;
  let expiredEntries = 0;
  const now = Date.now();
  
  verificationCache.forEach((entry) => {
    if (now > entry.expiresAt) {
      expiredEntries++;
    } else {
      validEntries++;
    }
  });
  
  return {
    totalEntries: verificationCache.size,
    validEntries,
    expiredEntries,
    cacheTTLHours: CACHE_TTL_MS / (60 * 60 * 1000)
  };
};

/**
 * Parse verification status to user-friendly message
 * @param {string} status - Verification status
 * @returns {Object} - Status info with message and color
 */
export const getStatusInfo = (status) => {
  switch (status) {
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
        description: 'No credential found with this ID.',
        color: 'warning',
        icon: 'search'
      };
    case VerificationStatus.PENDING:
      return {
        message: 'Verification Pending',
        description: 'Verification is in progress.',
        color: 'info',
        icon: 'loader'
      };
    default:
      return {
        message: 'Verification Error',
        description: 'An error occurred during verification.',
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
