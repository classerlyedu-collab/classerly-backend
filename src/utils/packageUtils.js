const packages = require('../config/packages.json');

/**
 * Get parent package based on student count and billing cycle
 * @param {number} studentCount - Number of students
 * @param {string} billingCycle - 'monthly' or 'yearly'
 * @returns {object} Package configuration
 */
function getParentPackage(studentCount, billingCycle = 'monthly') {
  if (billingCycle === 'yearly') {
    return packages.parent.yearly[0]; // All Students Yearly Plan
  }
  
  if (studentCount === 1) return packages.parent.monthly[0]; // 1 Student Plan
  if (studentCount === 2) return packages.parent.monthly[1]; // 2 Students Plan
  if (studentCount >= 3) return packages.parent.monthly[2]; // 3+ Students Plan
  
  throw new Error('Invalid student count');
}

/**
 * Get teacher package based on billing cycle
 * @param {string} billingCycle - 'monthly' or 'yearly'
 * @returns {object} Package configuration
 */
function getTeacherPackage(billingCycle = 'monthly') {
  if (billingCycle === 'monthly') {
    return packages.teacher.monthly[0]; // Teacher Monthly Plan
  } else if (billingCycle === 'yearly') {
    return packages.teacher.yearly[0]; // Teacher Yearly Plan
  }
  throw new Error('Invalid billing cycle');
}

/**
 * Validate billing cycle
 * @param {string} billingCycle - Billing cycle to validate
 * @returns {boolean} True if valid
 */
function isValidBillingCycle(billingCycle) {
  return ['monthly', 'yearly'].includes(billingCycle);
}

/**
 * Validate student count for parent users
 * @param {number} studentCount - Number of students
 * @returns {boolean} True if valid
 */
function isValidStudentCount(studentCount) {
  return studentCount && studentCount > 0 && studentCount <= 10; // Max 10 students
}

/**
 * Get package for any user type
 * @param {string} userType - User type ('Parent', 'Teacher', 'Student')
 * @param {string} billingCycle - Billing cycle
 * @param {number} studentCount - Student count (for parents only)
 * @returns {object} Package configuration
 */
function getPackageForUser(userType, billingCycle = 'monthly', studentCount = null) {
  if (!isValidBillingCycle(billingCycle)) {
    throw new Error('Invalid billing cycle. Must be "monthly" or "yearly"');
  }

  switch (userType) {
    case 'Parent':
      if (!isValidStudentCount(studentCount)) {
        throw new Error('Invalid student count. Must be between 1 and 10');
      }
      return getParentPackage(studentCount, billingCycle);
    
    case 'Teacher':
      return getTeacherPackage(billingCycle);
    
    case 'Student':
      throw new Error('Students do not require subscription packages');
    
    default:
      throw new Error(`Unsupported user type: ${userType}`);
  }
}

module.exports = {
  getParentPackage,
  getTeacherPackage,
  getPackageForUser,
  isValidBillingCycle,
  isValidStudentCount,
  packages
};
