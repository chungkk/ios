/**
 * Validation utility functions for forms
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || email.trim().length === 0) {
    return false;
  }
  return EMAIL_REGEX.test(email.toLowerCase().trim());
};

/**
 * Validate email and return error message if invalid
 */
export const validateEmail = (email: string): string | undefined => {
  if (!email || email.trim().length === 0) {
    return 'Email is required';
  }
  if (!isValidEmail(email)) {
    return 'Invalid email format';
  }
  return undefined;
};

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 */
export const isValidPassword = (password: string): boolean => {
  if (!password || password.length < 8) {
    return false;
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasUpperCase && hasLowerCase && hasNumber;
};

/**
 * Validate password and return error message if invalid
 */
export const validatePassword = (password: string): string | undefined => {
  if (!password || password.length === 0) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least 1 lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least 1 number';
  }
  return undefined;
};

/**
 * Validate password confirmation matches
 */
export const validatePasswordConfirm = (
  password: string,
  confirmPassword: string,
): string | undefined => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return undefined;
};

/**
 * Validate name (1-100 characters)
 */
export const validateName = (name: string): string | undefined => {
  if (!name || name.trim().length === 0) {
    return 'Name is required';
  }
  if (name.trim().length > 100) {
    return 'Name must be less than 100 characters';
  }
  return undefined;
};

/**
 * Validate required field
 */
export const validateRequired = (value: string, fieldName: string = 'This field'): string | undefined => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return undefined;
};

/**
 * Get password strength score (0-4)
 * 0: Very weak
 * 1: Weak
 * 2: Fair
 * 3: Good
 * 4: Strong
 */
export const getPasswordStrength = (password: string): number => {
  if (!password || password.length === 0) {
    return 0;
  }

  let strength = 0;

  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++; // Special characters

  return Math.min(strength, 4);
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (password: string): string => {
  const strength = getPasswordStrength(password);
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return labels[strength];
};

/**
 * Get password strength color
 */
export const getPasswordStrengthColor = (password: string): string => {
  const strength = getPasswordStrength(password);
  const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#10b981'];
  return colors[strength];
};
