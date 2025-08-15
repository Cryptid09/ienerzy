/**
 * Role-based access control utilities
 * Centralized role checking for consistent security across components
 */

// Role constants
export const ROLES = {
  CONSUMER: 'consumer',
  DEALER: 'dealer',
  ADMIN: 'admin',
  NBFC: 'nbfc'
};

// Role hierarchy (higher roles inherit lower role permissions)
export const ROLE_HIERARCHY = {
  [ROLES.CONSUMER]: 1,
  [ROLES.DEALER]: 2,
  [ROLES.NBFC]: 2,
  [ROLES.ADMIN]: 3
};

/**
 * Check if user has a specific role
 * @param {Object} user - User object with role property
 * @param {string} role - Role to check
 * @returns {boolean} - True if user has the role
 */
export const hasRole = (user, role) => {
  if (!user || !user.role) return false;
  return user.role === role;
};

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object with role property
 * @param {Array<string>} roles - Array of roles to check
 * @returns {boolean} - True if user has any of the roles
 */
export const hasAnyRole = (user, roles) => {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
};

/**
 * Check if user has minimum role level
 * @param {Object} user - User object with role property
 * @param {string} minRole - Minimum role required
 * @returns {boolean} - True if user has minimum role level
 */
export const hasMinimumRole = (user, minRole) => {
  if (!user || !user.role) return false;
  const userLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Check if user can manage batteries
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user can manage batteries
 */
export const canManageBatteries = (user) => {
  return hasAnyRole(user, [ROLES.DEALER, ROLES.ADMIN]);
};

/**
 * Check if user can manage consumers
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user can manage consumers
 */
export const canManageConsumers = (user) => {
  return hasAnyRole(user, [ROLES.DEALER, ROLES.ADMIN]);
};

/**
 * Check if user can create service tickets
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user can create service tickets
 */
export const canCreateServiceTickets = (user) => {
  return hasAnyRole(user, [ROLES.CONSUMER, ROLES.DEALER, ROLES.ADMIN]);
};

/**
 * Check if user can manage finance
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user can manage finance
 */
export const canManageFinance = (user) => {
  return hasAnyRole(user, [ROLES.DEALER, ROLES.ADMIN]);
};

/**
 * Check if user can access NBFC operations
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user can access NBFC operations
 */
export const canAccessNBFC = (user) => {
  return hasAnyRole(user, [ROLES.NBFC, ROLES.ADMIN]);
};

/**
 * Check if user can view analytics
 * @param {Object} user - User object with role property
 * @returns {boolean} - True if user can view analytics
 */
export const canViewAnalytics = (user) => {
  return hasAnyRole(user, [ROLES.DEALER, ROLES.ADMIN, ROLES.NBFC]);
};

/**
 * Get user-friendly role display name
 * @param {string} role - Role string
 * @returns {string} - User-friendly role name
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    [ROLES.CONSUMER]: 'Consumer',
    [ROLES.DEALER]: 'Dealer',
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.NBFC]: 'NBFC Partner'
  };
  return roleNames[role] || role;
};

/**
 * Check if user can edit their own data
 * @param {Object} user - User object
 * @param {Object} data - Data object to check ownership
 * @returns {boolean} - True if user can edit the data
 */
export const canEditOwnData = (user, data) => {
  if (!user || !data) return false;
  
  // Admins can edit everything
  if (hasRole(user, ROLES.ADMIN)) return true;
  
  // Users can edit their own data
  if (data.user_id === user.id || data.owner_id === user.id) return true;
  
  // Dealers can edit their consumers' data
  if (hasRole(user, ROLES.DEALER) && data.dealer_id === user.id) return true;
  
  return false;
};

/**
 * Get role-based component visibility
 * @param {Object} user - User object
 * @param {string} component - Component name
 * @returns {boolean} - True if component should be visible
 */
export const getComponentVisibility = (user, component) => {
  const visibilityRules = {
    'AddBattery': canManageBatteries(user),
    'AddConsumer': canManageConsumers(user),
    'CreateServiceTicket': canCreateServiceTickets(user),
    'ManageFinance': canManageFinance(user),
    'AccessNBFC': canAccessNBFC(user),
    'ViewAnalytics': canViewAnalytics(user)
  };
  
  return visibilityRules[component] || false;
};

export default {
  ROLES,
  ROLE_HIERARCHY,
  hasRole,
  hasAnyRole,
  hasMinimumRole,
  canManageBatteries,
  canManageConsumers,
  canCreateServiceTickets,
  canManageFinance,
  canAccessNBFC,
  canViewAnalytics,
  getRoleDisplayName,
  canEditOwnData,
  getComponentVisibility
}; 