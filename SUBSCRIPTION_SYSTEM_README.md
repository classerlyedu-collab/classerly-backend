# Classerly Subscription System

This document describes the new role-based subscription system implemented with Stripe Checkout.

## Overview

The subscription system has been completely refactored to provide a clean, role-based subscription flow using Stripe Checkout. The system dynamically determines packages based on user role and student count, with pricing loaded from a JSON configuration file.

## Features

- **Role-based pricing**: Different packages for Parents, Teachers, and Students
- **Dynamic student count**: Parent packages automatically adjust based on number of students
- **Flexible billing**: Monthly and yearly subscription options
- **Stripe Checkout**: Secure, hosted payment experience
- **Webhook integration**: Automatic subscription status updates
- **JSON configuration**: Easy package and pricing management

## Package Configuration

All subscription packages are defined in `src/config/packages.json`:

```json
{
  "parent": {
    "monthly": {
      "1_student": {
        "price": 9.99,
        "stripe_price_id": "price_1_student_monthly",
        "description": "1 Student - Monthly Plan"
      },
      "2_students": {
        "price": 14.99,
        "stripe_price_id": "price_2_students_monthly",
        "description": "2 Students - Monthly Plan"
      },
      "3_plus_students": {
        "price": 199.99,
        "stripe_price_id": "price_3_plus_students_monthly",
        "description": "3+ Students - Monthly Plan"
      }
    },
    "yearly": {
      "all_students": {
        "price": 79.99,
        "stripe_price_id": "price_parent_yearly",
        "description": "All Students - Yearly Plan"
      }
    }
  },
  "teacher": {
    "monthly": {
      "basic": {
        "price": 27.99,
        "stripe_price_id": "price_teacher_monthly",
        "description": "Teacher - Monthly Plan"
      }
    },
    "yearly": {
      "basic": {
        "price": 299.99,
        "stripe_price_id": "price_teacher_yearly",
        "description": "Teacher - Yearly Plan"
      }
    }
  }
}
```

## API Endpoints

### 1. Create Checkout Session

**Endpoint:** `POST /api/v1/payment/create-checkout-session`

**Authentication:** JWT token required

**Purpose:** Create Stripe Checkout session based on user role and package selection

#### Request Body (Optional)
```json
{
  "packageType": "monthly" | "yearly",  // Optional, defaults to monthly
  "studentCount": 1 | 2 | 3             // Required for parents, ignored for teachers
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "url": "https://checkout.stripe.com/pay/cs_test_...",
    "package": {
      "name": "1 Student - Monthly Plan",
      "price": 9.99,
      "currency": "USD"
    }
  },
  "message": "Checkout session created successfully"
}
```

#### Package Selection Logic

**For Parent Users:**
- Extracts student count from request body or user profile
- Determines package based on student count:
  - 1 student → 1_student package
  - 2 students → 2_students package
  - 3+ students → 3_plus_students package
- Applies monthly/yearly pricing from packages.json

**For Teacher Users:**
- Uses teacher packages from packages.json
- Applies monthly/yearly pricing

**For Student Users:**
- Returns success with redirect to dashboard (no payment needed)

### 2. Customer Portal Session

**Endpoint:** `POST /api/v1/payment/create-customer-portal-session`

**Authentication:** JWT token required

**Purpose:** Create Stripe Customer Portal session for subscription management

#### Response
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/..."
  },
  "message": "Portal session created successfully"
}
```

### 3. Webhook Handler

**Endpoint:** `POST /api/v1/payment/webhook`

**Authentication:** None (Stripe handles verification)

**Purpose:** Handle Stripe webhook events for subscription lifecycle

#### Supported Events
- `checkout.session.completed`: Activates subscription
- `customer.subscription.created`: Updates subscription status
- `customer.subscription.updated`: Updates subscription status
- `customer.subscription.deleted`: Deactivates subscription

## Implementation Details

### Package Selection Functions

```javascript
// Get parent package based on student count and billing cycle
function getParentPackage(studentCount, billingCycle = 'monthly') {
  if (billingCycle === 'yearly') {
    return packages.parent.yearly.all_students;
  }
  
  if (studentCount === 1) return packages.parent.monthly['1_student'];
  if (studentCount === 2) return packages.parent.monthly['2_students'];
  if (studentCount >= 3) return packages.parent.monthly['3_plus_students'];
  
  throw new Error('Invalid student count');
}

// Get teacher package based on billing cycle
function getTeacherPackage(billingCycle = 'monthly') {
  return packages.teacher[billingCycle].basic;
}
```

### Success/Cancel URL Structure

```
success_url: ${FRONTEND_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}&package=${packageName}
cancel_url: ${FRONTEND_URL}/dashboard?canceled=true
```

### Metadata for Tracking

Each Stripe session includes metadata for user tracking:
- `userId`: User's database ID
- `userType`: User role (Parent, Teacher, Student)
- `packageType`: Billing cycle (monthly, yearly)
- `studentCount`: Number of students (for parents)
- `packageName`: Package description
- `packagePrice`: Package price

## Environment Variables

Required environment variables:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-frontend-domain.com
```

## Frontend Integration

### Example: Parent Subscription

```javascript
const createParentSubscription = async (studentCount = 2, packageType = 'monthly') => {
  const response = await fetch('/api/v1/payment/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      packageType,
      studentCount
    })
  });
  
  const data = await response.json();
  if (data.success) {
    window.location.href = data.data.url; // Redirect to Stripe Checkout
  }
};
```

### Example: Teacher Subscription

```javascript
const createTeacherSubscription = async (packageType = 'monthly') => {
  const response = await fetch('/api/v1/payment/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ packageType })
  });
  
  const data = await response.json();
  if (data.success) {
    window.location.href = data.data.url;
  }
};
```

### Handle Redirects

```javascript
const handleSubscriptionRedirect = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get('success');
  const canceled = urlParams.get('canceled');
  const sessionId = urlParams.get('session_id');
  const package = urlParams.get('package');
  
  if (success) {
    console.log('Payment successful!', { sessionId, package });
    // Update UI to show subscription active
  } else if (canceled) {
    console.log('Payment canceled');
    // Show cancellation message
  }
};
```

## Error Handling

The system provides comprehensive error handling:

- **400 Bad Request**: Invalid package selection or student count
- **401 Unauthorized**: Missing or invalid JWT token
- **404 Not Found**: User not found
- **500 Internal Server Error**: Stripe or server errors

All errors include meaningful error messages for debugging.

## Testing

Use the test utility in `src/utils/subscriptionTest.js` to test the system:

```javascript
const { testCheckoutSession, testPackageUtils } = require('./utils/subscriptionTest');

// Test package utility functions
testPackageUtils();

// Test API endpoints (requires valid JWT token)
// testCheckoutSession();
```

## Migration from Old System

### What's New
- Single endpoint for all subscription types
- Dynamic package selection based on user role
- JSON-based configuration
- Stripe Checkout instead of Elements
- Comprehensive webhook handling

### What's Removed
- Old payment intent endpoints (deprecated but kept for compatibility)
- Stripe Elements integration
- Manual subscription management

### What's Kept
- Existing Stripe configuration
- User authentication middleware
- Database models for subscriptions
- Customer portal functionality

## Security Considerations

1. **JWT Authentication**: All endpoints require valid JWT tokens
2. **Stripe Webhook Verification**: Webhooks are verified using Stripe signatures
3. **Input Validation**: All inputs are validated before processing
4. **Error Handling**: Sensitive information is not exposed in error messages
5. **Metadata**: User information is stored in Stripe metadata for tracking

## Monitoring and Logging

The system includes comprehensive logging:

- Checkout session creation
- Webhook event processing
- Subscription status changes
- Error conditions

All logs include relevant metadata for debugging and monitoring.

## Support

For issues or questions about the subscription system:

1. Check the logs for error details
2. Verify Stripe webhook configuration
3. Test with the provided test utilities
4. Review the package configuration file

## Future Enhancements

Potential improvements for the subscription system:

1. **Coupon Integration**: Support for discount codes
2. **Trial Periods**: Free trial functionality
3. **Usage Tracking**: Monitor subscription usage
4. **Analytics**: Subscription metrics and reporting
5. **Multi-currency**: Support for different currencies
