const { Router } = require("express");
const { verifytoken } = require('../middlewares/auth');
const {
    createPaymentIntent,
    createCustomerPortalSession,
    createCheckoutSession,
    getUserSubscriptionStatus,
    getTrialInfo,
    debugSubscriptionStatus,
    getSubscriptionDetails,
    handleWebhook,
    cancelSubscriptionByAdmin
} = require("../controllers/paymentController");

const router = Router();

// New Stripe Checkout endpoint
router.post("/create-checkout-session", verifytoken, createCheckoutSession);

// Customer portal for subscription management
router.post("/create-customer-portal-session", verifytoken, createCustomerPortalSession);

// Webhook handler (no auth required - Stripe handles verification)
router.post("/webhook", handleWebhook);

// Legacy endpoint (deprecated - kept for backward compatibility)
router.post("/create-payment-intent", verifytoken, createPaymentIntent);

router.get("/user-subscription-status", verifytoken, getUserSubscriptionStatus);

// Trial information endpoint
router.get("/trial-info", verifytoken, getTrialInfo);

// Debug endpoint for troubleshooting
router.get("/debug-subscription", verifytoken, debugSubscriptionStatus);

// Get subscription details from subscriptions collection
router.get("/subscription-details", verifytoken, getSubscriptionDetails);

// Admin endpoint to cancel subscriptions
router.post("/cancel-subscription", verifytoken, cancelSubscriptionByAdmin);

module.exports = router;
