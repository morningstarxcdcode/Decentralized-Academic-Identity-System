// Email domain validation service for role-based access control
// Validates institutional email domains for university, government, and admin roles
// Time complexity: O(n) where n is the number of domain patterns to check

// Load university domain patterns from environment configuration
const getUniversityDomains = () => {
  const domainList = import.meta.env.VITE_UNIVERSITY_DOMAINS || '.edu,.ac.uk,.edu.au,.ac.in';
  return domainList.split(',').map(domain => domain.trim().toLowerCase());
};

// Load government domain patterns from environment configuration
const getGovernmentDomains = () => {
  const domainList = import.meta.env.VITE_GOVERNMENT_DOMAINS || '.gov,.gov.uk,.gov.au';
  return domainList.split(',').map(domain => domain.trim().toLowerCase());
};

// Load admin email whitelist from environment configuration
const getAdminWhitelist = () => {
  const whitelistValue = import.meta.env.VITE_ADMIN_WHITELIST || '';
  return whitelistValue.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
};

// Check if email suffix matches any configured domain pattern
// Time complexity: O(n) where n is pattern count
const matchesDomainPattern = (emailAddress, domainPatterns) => {
  if (!emailAddress || !domainPatterns.length) return false;
  const normalizedEmail = emailAddress.toLowerCase();
  return domainPatterns.some(pattern => normalizedEmail.endsWith(pattern));
};

// Validate email against role-specific domain requirements
// Returns validation result with reason for failure
// Time complexity: O(n) for pattern matching
export const validateForRole = (emailAddress, targetRole) => {
  if (!emailAddress || typeof emailAddress !== 'string') {
    return { isValid: false, reason: 'Email address is required' };
  }

  // Validate basic email format using regex
  const emailFormatRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailFormatRegex.test(emailAddress)) {
    return { isValid: false, reason: 'Invalid email format' };
  }

  const normalizedEmail = emailAddress.toLowerCase();
  const normalizedRole = (targetRole || '').toLowerCase();

  switch (normalizedRole) {
    case 'university': {
      const universityPatterns = getUniversityDomains();
      if (matchesDomainPattern(normalizedEmail, universityPatterns)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        reason: `University role requires educational email domain (${universityPatterns.slice(0, 3).join(', ')}, etc.)`
      };
    }

    case 'government': {
      const governmentPatterns = getGovernmentDomains();
      if (matchesDomainPattern(normalizedEmail, governmentPatterns)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        reason: `Government role requires official government email domain (${governmentPatterns.slice(0, 3).join(', ')}, etc.)`
      };
    }

    case 'admin': {
      const adminEmailList = getAdminWhitelist();
      if (adminEmailList.length === 0) {
        return { isValid: false, reason: 'Admin registration is not available' };
      }
      if (adminEmailList.includes(normalizedEmail)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        reason: 'This email is not authorized for admin access'
      };
    }

    case 'student':
    case 'employer':
    default:
      // Students and employers can use any valid email format
      return { isValid: true };
  }
};

/**
 * Suggest a role based on email domain
 * @param {string} email - Email address
 * @returns {string} - Suggested role
 */
export const suggestRole = (email) => {
  if (!email || typeof email !== 'string') {
    return 'student';
 / Automatically detect appropriate role based on email domain
// Time complexity: O(n) for domain pattern matching
export const suggestRole = (emailAddress) => {
  if (!emailAddress || typeof emailAddress !== 'string') {
    return 'student';
  }

  const normalizedEmail = emailAddress.toLowerCase();

  // Priority 1: Check admin whitelist
  const adminEmailList = getAdminWhitelist();
  if (adminEmailList.includes(normalizedEmail)) {
    return 'admin';
  }

  // Priority 2: Check government domain patterns
  const governmentPatterns = getGovernmentDomains();
  if (matchesDomainPattern(normalizedEmail, governmentPatterns)) {
    return 'government';
  }

  // Priority 3: Check university domain patterns
  const universityPatterns = getUniversityDomains();
  if (matchesDomainPattern(normalizedEmail, universityPatterns)) {
    return 'university';
  }

  // Default: student role for general email addresses
  return 'student';
};

// Check if email exists in admin whitelist
// Time complexity: O(n) where n is whitelist size
export const isAdminEmail = (emailAddress) => {
  if (!emailAddress) return false;
  const adminEmailList = getAdminWhitelist();
  return adminEmailList.includes(emailAddress.toLowerCase());
};

// Retrieve domain patterns for specified role
// Time complexity: O(1)
export const getDomainPatterns = (targetRole) => {
  switch ((targetR [];
  }
};

export default {
  validateForRole,
  suggestRole,
  isAdminEmail,
  getDomainPatterns
};
