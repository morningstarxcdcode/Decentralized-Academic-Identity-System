/**
 * Email Domain Validator Service
 * 
 * Validates email domains for role-based access control.
 * Supports university, government, and admin role restrictions.
 */

// Load domain patterns from environment variables
const getUniversityDomains = () => {
  const domains = import.meta.env.VITE_UNIVERSITY_DOMAINS || '.edu,.ac.uk,.edu.au,.ac.in';
  return domains.split(',').map(d => d.trim().toLowerCase());
};

const getGovernmentDomains = () => {
  const domains = import.meta.env.VITE_GOVERNMENT_DOMAINS || '.gov,.gov.uk,.gov.au';
  return domains.split(',').map(d => d.trim().toLowerCase());
};

const getAdminWhitelist = () => {
  const whitelist = import.meta.env.VITE_ADMIN_WHITELIST || '';
  return whitelist.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
};

/**
 * Check if email matches any domain pattern
 * @param {string} email - Email to check
 * @param {string[]} patterns - Domain patterns to match against
 * @returns {boolean}
 */
const matchesDomainPattern = (email, patterns) => {
  if (!email || !patterns.length) return false;
  const emailLower = email.toLowerCase();
  return patterns.some(pattern => emailLower.endsWith(pattern));
};

/**
 * Validate email for a specific role
 * @param {string} email - Email address to validate
 * @param {string} role - Role to validate against
 * @returns {{isValid: boolean, suggestedRole?: string, reason?: string}}
 */
export const validateForRole = (email, role) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, reason: 'Email is required' };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, reason: 'Invalid email format' };
  }

  const emailLower = email.toLowerCase();
  const roleLower = (role || '').toLowerCase();

  switch (roleLower) {
    case 'university': {
      const universityDomains = getUniversityDomains();
      if (matchesDomainPattern(emailLower, universityDomains)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        reason: `University role requires an educational email domain (${universityDomains.slice(0, 3).join(', ')}, etc.)`
      };
    }

    case 'government': {
      const govDomains = getGovernmentDomains();
      if (matchesDomainPattern(emailLower, govDomains)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        reason: `Government role requires a government email domain (${govDomains.slice(0, 3).join(', ')}, etc.)`
      };
    }

    case 'admin': {
      const adminWhitelist = getAdminWhitelist();
      if (adminWhitelist.length === 0) {
        return { isValid: false, reason: 'Admin registration is not available' };
      }
      if (adminWhitelist.includes(emailLower)) {
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
      // Students and employers can use any valid email
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
  }

  const emailLower = email.toLowerCase();

  // Check admin whitelist first
  const adminWhitelist = getAdminWhitelist();
  if (adminWhitelist.includes(emailLower)) {
    return 'admin';
  }

  // Check government domains
  const govDomains = getGovernmentDomains();
  if (matchesDomainPattern(emailLower, govDomains)) {
    return 'government';
  }

  // Check university domains
  const universityDomains = getUniversityDomains();
  if (matchesDomainPattern(emailLower, universityDomains)) {
    return 'university';
  }

  // Default to student
  return 'student';
};

/**
 * Check if email is in admin whitelist
 * @param {string} email - Email to check
 * @returns {boolean}
 */
export const isAdminEmail = (email) => {
  if (!email) return false;
  const adminWhitelist = getAdminWhitelist();
  return adminWhitelist.includes(email.toLowerCase());
};

/**
 * Get domain patterns for a role
 * @param {string} role - Role to get patterns for
 * @returns {string[]}
 */
export const getDomainPatterns = (role) => {
  switch ((role || '').toLowerCase()) {
    case 'university':
      return getUniversityDomains();
    case 'government':
      return getGovernmentDomains();
    case 'admin':
      return getAdminWhitelist();
    default:
      return [];
  }
};

export default {
  validateForRole,
  suggestRole,
  isAdminEmail,
  getDomainPatterns
};
