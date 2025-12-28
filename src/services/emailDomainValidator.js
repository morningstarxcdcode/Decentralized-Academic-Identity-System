/**
 * Email Domain Validation Service
 * Implements role-based access control through institutional email domain verification
 * Supports university, government, and admin roles with configurable domain patterns
 * Time complexity: O(n) where n is the number of domain patterns to check
 */

/**
 * Domain Configuration Loaders
 * Retrieve domain patterns from environment variables
 */

function loadUniversityDomainPatterns() {
  const domainsFromEnv = import.meta.env.VITE_UNIVERSITY_DOMAINS || '.edu,.ac.uk,.edu.au,.ac.in';
  return domainsFromEnv.split(',').map(domain => domain.trim().toLowerCase());
}

function loadGovernmentDomainPatterns() {
  const domainsFromEnv = import.meta.env.VITE_GOVERNMENT_DOMAINS || '.gov,.gov.uk,.gov.au';
  return domainsFromEnv.split(',').map(domain => domain.trim().toLowerCase());
}

function loadAdminWhitelistedEmails() {
  const whitelistFromEnv = import.meta.env.VITE_ADMIN_WHITELIST || '';
  return whitelistFromEnv.split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);
}

/**
 * Domain Pattern Matching
 * Checks if an email address ends with any of the provided domain patterns
 */

function doesEmailMatchDomainPattern(emailAddress, domainPatterns) {
  if (!emailAddress || !Array.isArray(domainPatterns) || domainPatterns.length === 0) {
    return false;
  }
  
  const normalizedEmail = emailAddress.toLowerCase();
  return domainPatterns.some(pattern => normalizedEmail.endsWith(pattern));
}

/**
 * Email Format Validation
 * Verifies basic email structure before domain checking
 */

function isValidEmailFormat(emailAddress) {
  if (!emailAddress || typeof emailAddress !== 'string') {
    return false;
  }
  
  // Basic email format regex: something@something.something
  const emailFormatPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailFormatPattern.test(emailAddress);
}

/**
 * Role-Based Email Validation
 * Validates email address against role-specific domain requirements
 * Returns validation result with detailed failure reason
 */

function validateEmailForRole(emailAddress, requiredRole) {
  // Check email format first
  if (!isValidEmailFormat(emailAddress)) {
    return { 
      isValid: false, 
      reason: 'Email address format is invalid. Please use a valid email address.' 
    };
  }

  const normalizedEmail = emailAddress.toLowerCase();
  const normalizedRole = (requiredRole || '').toLowerCase().trim();

  switch (normalizedRole) {
    case 'university': {
      // University role requires educational institution email
      const universityDomainPatterns = loadUniversityDomainPatterns();
      if (doesEmailMatchDomainPattern(normalizedEmail, universityDomainPatterns)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        reason: `University role requires an educational institution email address (e.g., ${universityDomainPatterns.slice(0, 3).join(', ')}, etc.)`
      };
    }

    case 'government': {
      // Government role requires official government email
      const governmentDomainPatterns = loadGovernmentDomainPatterns();
      if (doesEmailMatchDomainPattern(normalizedEmail, governmentDomainPatterns)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        reason: `Government role requires an official government email address (e.g., ${governmentDomainPatterns.slice(0, 3).join(', ')}, etc.)`
      };
    }

    case 'admin': {
      // Admin role requires whitelisted email addresses only
      const adminWhitelistedEmails = loadAdminWhitelistedEmails();
      
      if (adminWhitelistedEmails.length === 0) {
        return { 
          isValid: false, 
          reason: 'Administrator registration is currently not available' 
        };
      }
      
      if (adminWhitelistedEmails.includes(normalizedEmail)) {
        return { isValid: true };
      }
      
      return {
        isValid: false,
        reason: 'This email address is not authorized for administrator access'
      };
    }

    case 'student':
    case 'employer':
    default:
      // Students and employers can use any valid email format
      return { isValid: true };
  }
}

/**
 * Role Suggestion
 * Automatically detects the appropriate role based on email domain
 * Priority: Admin (whitelist) > Government > University > Student
 */

function suggestRoleFromEmail(emailAddress) {
  if (!emailAddress || typeof emailAddress !== 'string') {
    return 'student'; // Default role for generic emails
  }

  const normalizedEmail = emailAddress.toLowerCase();

  // Priority 1: Check if email is in admin whitelist
  const adminWhitelistedEmails = loadAdminWhitelistedEmails();
  if (adminWhitelistedEmails.includes(normalizedEmail)) {
    return 'admin';
  }

  // Priority 2: Check if matches government domain pattern
  const governmentDomainPatterns = loadGovernmentDomainPatterns();
  if (doesEmailMatchDomainPattern(normalizedEmail, governmentDomainPatterns)) {
    return 'government';
  }

  // Priority 3: Check if matches university domain pattern
  const universityDomainPatterns = loadUniversityDomainPatterns();
  if (doesEmailMatchDomainPattern(normalizedEmail, universityDomainPatterns)) {
    return 'university';
  }

  // Default: student role for all other valid emails
  return 'student';
}

/**
 * Admin Email Checker
 * Quickly determines if an email is in the admin whitelist
 */

function checkIfEmailIsAdmin(emailAddress) {
  if (!emailAddress || typeof emailAddress !== 'string') {
    return false;
  }
  
  const adminWhitelistedEmails = loadAdminWhitelistedEmails();
  return adminWhitelistedEmails.includes(emailAddress.toLowerCase());
}

/**
 * Domain Pattern Retriever
 * Returns the applicable domain patterns for a given role
 */

function retrieveDomainPatternsForRole(targetRole) {
  const normalizedRole = (targetRole || '').toLowerCase().trim();

  switch (normalizedRole) {
    case 'university':
      return loadUniversityDomainPatterns();
    case 'government':
      return loadGovernmentDomainPatterns();
    case 'admin':
      return loadAdminWhitelistedEmails();
    default:
      return [];
  }
}

// Export public API
export const validateForRole = validateEmailForRole;
export const suggestRole = suggestRoleFromEmail;
export const isAdminEmail = checkIfEmailIsAdmin;
export const getDomainPatterns = retrieveDomainPatternsForRole;

/**
 * Module Export
 */
export default {
  validateForRole,
  suggestRole,
  isAdminEmail,
  getDomainPatterns
};
