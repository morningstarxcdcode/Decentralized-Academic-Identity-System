// Email domain validation service for role-based access control
// Verifies that user email domains match organizational requirements
// Supports educational institutions, government agencies, and admin whitelisting

// Retrieve configured university domain suffixes from environment
// Defaults to common educational TLDs if not specified
const getUniversityDomains = () => {
  const configuredDomains = import.meta.env.VITE_UNIVERSITY_DOMAINS || '.edu,.ac.uk,.edu.au,.ac.in';
  return configuredDomains.split(',').map(domain => domain.trim().toLowerCase());
};

// Retrieve configured government domain suffixes from environment
const getGovernmentDomains = () => {
  const configuredDomains = import.meta.env.VITE_GOVERNMENT_DOMAINS || '.gov,.gov.uk,.gov.au';
  return configuredDomains.split(',').map(domain => domain.trim().toLowerCase());
};

// Retrieve admin email whitelist - explicit addresses only
const getAdminWhitelist = () => {
  const whitelistConfig = import.meta.env.VITE_ADMIN_WHITELIST || '';
  return whitelistConfig.split(',')
    .map(emailAddr => emailAddr.trim().toLowerCase())
    .filter(Boolean);
};

// Check if email address ends with any specified domain pattern
// Time complexity: O(n) where n is number of patterns
const matchesDomainPattern = (emailAddress, domainPatterns) => {
  if (!emailAddress || !domainPatterns.length) {
    return false;
  }
  
  const normalizedEmail = emailAddress.toLowerCase();
  return domainPatterns.some(pattern => normalizedEmail.endsWith(pattern));
};

// Validate email domain against role requirements
// Returns validation result with optional suggested role and reason
export const validateForRole = (emailAddress, requestedRole) => {
  if (!emailAddress || typeof emailAddress !== 'string') {
    return { isValid: false, reason: 'Email is required' };
  }

  // Verify basic email format using regex
  const emailFormatPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailFormatPattern.test(emailAddress)) {
    return { isValid: false, reason: 'Invalid email format' };
  }

  const normalizedEmail = emailAddress.toLowerCase();
  const normalizedRole = (requestedRole || '').toLowerCase();

  switch (normalizedRole) {
    case 'university': {
      const educationalDomains = getUniversityDomains();
      if (matchesDomainPattern(normalizedEmail, educationalDomains)) {
        return { isValid: true };
      }
      const exampleDomains = educationalDomains.slice(0, 3).join(', ');
      return {
        isValid: false,
        reason: `University role requires an educational email domain (${exampleDomains}, etc.)`
      };
    }

    case 'government': {
      const govDomains = getGovernmentDomains();
      if (matchesDomainPattern(normalizedEmail, govDomains)) {
        return { isValid: true };
      }
      const exampleGovDomains = govDomains.slice(0, 3).join(', ');
      return {
        isValid: false,
        reason: `Government role requires a government email domain (${exampleGovDomains}, etc.)`
      };
    }

    case 'admin': {
      const adminWhitelist = getAdminWhitelist();
      if (adminWhitelist.length === 0) {
        return { isValid: false, reason: 'Admin registration is not available' };
      }
      if (adminWhitelist.includes(normalizedEmail)) {
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
      // Open registration - any valid email format accepted
      return { isValid: true };
  }
};

// Suggest appropriate role based on email domain analysis
// Useful for auto-selecting role during registration
// Time complexity: O(m+n) where m=admin list size, n=domain patterns
export const suggestRole = (emailAddress) => {
  if (!emailAddress || typeof emailAddress !== 'string') {
    return 'student';
  }

  const normalizedEmail = emailAddress.toLowerCase();

  // Priority 1: Check admin whitelist for exact match
  const adminWhitelist = getAdminWhitelist();
  if (adminWhitelist.includes(normalizedEmail)) {
    return 'admin';
  }

  // Priority 2: Government domain detection
  const governmentDomains = getGovernmentDomains();
  if (matchesDomainPattern(normalizedEmail, governmentDomains)) {
    return 'government';
  }

  // Priority 3: Educational institution detection
  const educationalDomains = getUniversityDomains();
  if (matchesDomainPattern(normalizedEmail, educationalDomains)) {
    return 'university';
  }

  // Default fallback for unrecognized domains
  return 'student';
};

// Check if email address exists in admin whitelist
// Returns boolean for simple authorization checks
export const isAdminEmail = (emailAddress) => {
  if (!emailAddress) return false;
  const adminWhitelist = getAdminWhitelist();
  return adminWhitelist.includes(emailAddress.toLowerCase());
};

// Retrieve domain patterns configured for a specific role
// Useful for displaying allowed domains in UI
export const getDomainPatterns = (roleName) => {
  switch ((roleName || '').toLowerCase()) {
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

// Export all validation functions as default module
export default {
  validateForRole,
  suggestRole,
  isAdminEmail,
  getDomainPatterns
};
