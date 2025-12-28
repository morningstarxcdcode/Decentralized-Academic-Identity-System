/**
 * Protected Route Component
 * 
 * Restricts access based on authentication and role permissions.
 * Preserves intended destination URL for post-login redirect.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Role-based route permissions
const ROLE_ROUTES = {
  student: ['/student', '/profile', '/credential', '/marketplace', '/edit-profile'],
  university: ['/university', '/profile', '/credential', '/analytics', '/edit-profile'],
  government: ['/government', '/profile', '/analytics', '/credential', '/edit-profile'],
  admin: ['/*'], // Admin has access to all routes
  employer: ['/verifier', '/profile', '/credential', '/edit-profile']
};

// Default dashboard routes per role
const DEFAULT_DASHBOARDS = {
  student: '/student',
  university: '/university',
  government: '/government',
  admin: '/admin',
  employer: '/verifier'
};

/**
 * Check if a user role has access to a specific path
 * @param {string} role - User's role
 * @param {string} path - Route path to check
 * @param {string[]} allowedRoles - Optional specific roles allowed for this route
 * @returns {boolean}
 */
const hasRouteAccess = (role, path, allowedRoles = null) => {
  // If specific roles are provided, check against them
  if (allowedRoles && allowedRoles.length > 0) {
    return allowedRoles.includes(role);
  }

  // Admin has access to everything
  if (role === 'admin') {
    return true;
  }

  // Check role-based route permissions
  const allowedPaths = ROLE_ROUTES[role] || [];
  return allowedPaths.some(allowedPath => {
    if (allowedPath === '/*') return true;
    if (allowedPath.endsWith('/*')) {
      const basePath = allowedPath.slice(0, -2);
      return path.startsWith(basePath);
    }
    return path.startsWith(allowedPath);
  });
};

/**
 * Get the default dashboard for a role
 * @param {string} role - User's role
 * @returns {string}
 */
export const getDefaultDashboard = (role) => {
  return DEFAULT_DASHBOARDS[role] || '/student';
};

const ProtectedRoute = ({
  children,
  allowedRoles = null,
  requireAuth = true,
  requireOCID = false,
  redirectTo = '/login',
  fallback = null
}) => {
  const { isAuthenticated, loading, role, profile } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being determined
  if (loading) {
    return fallback || (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    // Preserve the intended destination for post-login redirect
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname + location.search }} 
        replace 
      />
    );
  }

  // Check OCID requirement
  if (requireOCID && !profile?.ocId) {
    return (
      <Navigate 
        to="/profile" 
        state={{ 
          from: location.pathname,
          message: 'Please connect your OpenCampus ID to access this feature'
        }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (isAuthenticated && !hasRouteAccess(role, location.pathname, allowedRoles)) {
    // Redirect to user's default dashboard
    const defaultDashboard = getDefaultDashboard(role);
    return <Navigate to={defaultDashboard} replace />;
  }

  return children;
};

export default ProtectedRoute;
