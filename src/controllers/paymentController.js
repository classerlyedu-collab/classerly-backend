const authModel = require("../models/auth");
const subscriptionModel = require("../models/subscription");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const trialConfig = require("../config/trialConfig");

/**
 * Payment Controller with Free Trial Support
 * 
 * This controller handles Stripe subscription management including:
 * - Free trial periods for all packages (configurable via STRIPE_TRIAL_PERIOD_DAYS)
 * - Card collection upfront (required for trial)
 * - Automatic billing after trial ends
 * - Trial status tracking and notifications
 * 
 * Trial Flow:
 * 1. User selects package and enters card details
 * 2. Trial starts immediately (no charge)
 * 3. User gets full access during trial
 * 4. After trial ends, card is charged automatically
 * 5. If payment fails, user loses access
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Configuration for trial period (in days)
// You can customize this value or move it to environment variables
const TRIAL_PERIOD_DAYS = trialConfig.TRIAL_PERIOD_DAYS;

/**
 * Create Stripe Checkout session for subscription
 * Accepts package information from frontend and creates checkout session
 */
exports.createCheckoutSession = asyncHandler(async (req, res) => {
  const { _id, userType } = req.user;
  const { billingCycle = 'monthly', packageName, packagePrice, stripePriceId } = req.body;

  // Get user details
  const user = await authModel.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Handle student users (no payment needed)
  if (userType === 'Student') {
    return res.status(200).json(
      new ApiResponse(200, { redirectUrl: `${process.env.FRONTEND_URL}/dashboard` }, "Students do not require subscription")
    );
  }

  // Validate required fields
  if (!packageName || !packagePrice || !stripePriceId) {
    throw new ApiError(400, "Missing required package information: packageName, packagePrice, stripePriceId");
  }

  // Get or create Stripe customer
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      metadata: {
        userId: _id.toString(),
        userType: userType
      }
    });

    stripeCustomerId = customer.id;
    user.stripeCustomerId = stripeCustomerId;
    await user.save();
  }

  // Create checkout session with the specific package and trial period
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}&package=${encodeURIComponent(packageName)}`,
    cancel_url: `${process.env.FRONTEND_URL}/subscription?canceled=true`,
    metadata: {
      userId: _id.toString(),
      userType: userType,
      billingCycle: billingCycle,
      packageName: packageName,
      packagePrice: packagePrice.toString()
    },
    subscription_data: {
      // 🆕 TRIAL PERIOD: Add free trial to all subscriptions
      // Users get immediate access without being charged
      // Card is collected upfront but not charged until trial ends
      trial_period_days: TRIAL_PERIOD_DAYS,
      metadata: {
        userId: _id.toString(),
        userType: userType,
        billingCycle: billingCycle,
        packageName: packageName,
        packagePrice: packagePrice.toString()
      }
    }
  });

  return res.status(200).json(
    new ApiResponse(200, { url: session.url }, "Checkout session created successfully")
  );
});

/**
 * Create Stripe Customer Portal session for subscription management
 */
exports.createCustomerPortalSession = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  // Get user details
  const user = await authModel.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.stripeCustomerId) {
    throw new ApiError(400, "No subscription found for this user");
  }

  try {
    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/subscription`,
    });

    return res.status(200).json(
      new ApiResponse(200, { url: session.url }, "Portal session created successfully")
    );
  } catch (stripeError) {

    // Handle specific Stripe errors
    if (stripeError.code === 'configuration_invalid') {
      throw new ApiError(500, "Customer portal not configured. Please contact support.");
    } else if (stripeError.code === 'customer_invalid') {
      throw new ApiError(400, "Invalid customer ID. Please contact support.");
    } else {
      throw new ApiError(500, `Failed to create customer portal: ${stripeError.message}`);
    }
  }
});

/**
 * Webhook handler for Stripe events
 * Handles subscription events and updates user subscription status
 */
exports.handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }



  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleCheckoutSessionCompleted(session);
      break;

    case 'customer.subscription.created':
      const newSubscription = event.data.object;
      await handleSubscriptionCreated(newSubscription);
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      await handleSubscriptionUpdated(updatedSubscription);
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      await handleSubscriptionDeleted(deletedSubscription);
      break;

    // Handle trial-specific events
    case 'customer.subscription.trial_will_end':
      const trialEndingSubscription = event.data.object;
      await handleTrialEnding(trialEndingSubscription);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      await handlePaymentFailed(failedInvoice);
      break;

    // Handle customer events
    case 'customer.created':
      const newCustomer = event.data.object;
      await handleCustomerCreated(newCustomer);
      break;

    case 'customer.updated':
      const updatedCustomer = event.data.object;
      await handleCustomerUpdated(updatedCustomer);
      break;

    // Handle invoice events
    case 'invoice.created':
    case 'invoice.finalized':
    case 'invoice.paid':
    case 'invoice.payment_succeeded':
      // These events are handled by subscription events, no action needed
      break;

    // Handle payment method events
    case 'payment_method.attached':
    case 'setup_intent.succeeded':
    case 'setup_intent.created':
      // These are setup events, no action needed
      break;

    default:
    // Unhandled event type - no action needed
  }

  res.json({ received: true });
});

/**
 * Handle checkout session completion
 * Now handles both immediate activations and trial starts
 */
async function handleCheckoutSessionCompleted(session) {
  const { userId, userType, billingCycle, packageName } = session.metadata;

  const user = await authModel.findById(userId);
  if (!user) {
    return;
  }

  // Update user with basic subscription info
  user.isSubscribed = true;

  // Check if this is a trial subscription
  if (session.subscription && session.subscription.status === 'trialing') {
    // User is in trial period - grant access but mark as trialing
    user.trialStatus = 'active';
    user.trialEndDate = new Date(session.subscription.trial_end * 1000);
    user.stripeCustomerId = session.customer;


  } else {
    // Regular subscription (no trial or trial already ended)
    user.trialStatus = 'completed';
    user.trialEndDate = null;
    user.stripeCustomerId = session.customer;

  }

  await user.save();

  // 🆕 Create initial subscription record in subscriptions collection
  if (session.subscription) {
    try {


      // Safely handle date fields - they might not be available during checkout completion
      const currentPeriodStart = session.subscription.current_period_start ?
        new Date(session.subscription.current_period_start * 1000) : new Date();

      const currentPeriodEnd = session.subscription.current_period_end ?
        new Date(session.subscription.current_period_end * 1000) :
        new Date(Date.now() + (TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000)); // Fallback to trial period

      const newSubscription = new subscriptionModel({
        user_id: userId,
        stripe_subscription_id: session.subscription.id,
        total_paid: parseFloat(session.metadata.packagePrice) || 0,
        subscription_date: new Date(),
        isActive: session.subscription.status === 'trialing' || session.subscription.status === 'active',
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        is_cancelled: false,
        cancelled_at: null,
        expired: false,
        billing_reason: session.subscription.status === 'trialing' ? 'trial' : 'subscription'
      });

      await newSubscription.save();
    } catch (error) {
      // Error creating subscription record
    }
  }
}

/**
 * Handle subscription updates
 * Now handles trial status changes and transitions
 */
async function handleSubscriptionUpdated(subscription) {
  const { userId, userType, billingCycle } = subscription.metadata;

  const user = await authModel.findById(userId);
  if (!user) {
    return;
  }

  // Update subscription status based on subscription status
  if (subscription.status === 'active') {
    // Subscription is active (trial ended successfully or regular subscription)
    user.isSubscribed = true;
    user.trialStatus = 'completed';
    user.trialEndDate = null; // Clear trial end date
  } else if (subscription.status === 'trialing') {
    // User is in trial period
    user.isSubscribed = true;
    user.trialStatus = 'active';
    user.trialEndDate = new Date(subscription.trial_end * 1000);
  } else if (subscription.status === 'past_due') {
    // Payment failed after trial - user still has access but needs to update payment
    user.isSubscribed = true;
    user.trialStatus = 'past_due';
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    // Subscription cancelled or unpaid - revoke access
    user.isSubscribed = false;
    user.trialStatus = 'none';
    user.trialEndDate = null;
  }

  await user.save();

  // 🆕 Update subscription in subscriptions collection
  try {
    const existingSubscription = await subscriptionModel.findOne({
      stripe_subscription_id: subscription.id
    });

    if (existingSubscription) {
      existingSubscription.isActive = subscription.status === 'trialing' || subscription.status === 'active';
      existingSubscription.current_period_end = new Date(subscription.current_period_end * 1000);
      existingSubscription.current_period_start = new Date(subscription.current_period_start * 1000);
      existingSubscription.is_cancelled = subscription.status === 'canceled';
      existingSubscription.cancelled_at = subscription.status === 'canceled' ? new Date() : null;
      existingSubscription.expired = subscription.status === 'expired';

      await existingSubscription.save();
    }
  } catch (error) {
    // Error updating subscription in database
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription) {
  const { userId } = subscription.metadata;

  const user = await authModel.findById(userId);
  if (!user) {
    return;
  }

  user.isSubscribed = false;
  user.trialStatus = 'none';
  user.trialEndDate = null;
  await user.save();

  // 🆕 Update subscription in subscriptions collection
  try {
    const existingSubscription = await subscriptionModel.findOne({
      stripe_subscription_id: subscription.id
    });

    if (existingSubscription) {
      existingSubscription.isActive = false;
      existingSubscription.is_cancelled = true;
      existingSubscription.cancelled_at = new Date();

      await existingSubscription.save();
    }
  } catch (error) {
    // Error updating subscription in database
  }
}

/**
 * Handle new subscription creation
 * This is the main handler for when a subscription is first created
 */
async function handleSubscriptionCreated(subscription) {
  const { userId, userType, billingCycle, packageName, packagePrice } = subscription.metadata;

  const user = await authModel.findById(userId);
  if (!user) {
    return;
  }

  // Update user with subscription details
  user.isSubscribed = true;
  user.stripeCustomerId = subscription.customer;

  // Check if this is a trial subscription
  if (subscription.status === 'trialing') {
    user.trialStatus = 'active';
    user.trialEndDate = new Date(subscription.trial_end * 1000);

  } else {
    user.trialStatus = 'completed';
    user.trialEndDate = null;

  }

  await user.save();

  // 🆕 Save subscription to subscriptions collection
  try {
    // Check if subscription already exists
    let existingSubscription = await subscriptionModel.findOne({
      stripe_subscription_id: subscription.id
    });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.isActive = subscription.status === 'trialing' || subscription.status === 'active';
      existingSubscription.current_period_end = new Date(subscription.current_period_end * 1000);
      existingSubscription.current_period_start = new Date(subscription.current_period_start * 1000);
      existingSubscription.is_cancelled = subscription.status === 'canceled';
      existingSubscription.cancelled_at = subscription.status === 'canceled' ? new Date() : null;
      existingSubscription.expired = subscription.status === 'expired';

      await existingSubscription.save();
    } else {
      // Create new subscription record with proper date handling
      const currentPeriodStart = new Date(subscription.current_period_start * 1000);
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);



      const newSubscription = new subscriptionModel({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        total_paid: parseFloat(packagePrice) || 0,
        subscription_date: new Date(),
        isActive: subscription.status === 'trialing' || subscription.status === 'active',
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        is_cancelled: subscription.status === 'canceled',
        cancelled_at: subscription.status === 'canceled' ? new Date() : null,
        expired: subscription.status === 'expired',
        billing_reason: subscription.status === 'trialing' ? 'trial' : 'subscription'
      });

      await newSubscription.save();
    }
  } catch (error) {
    // Error saving subscription to database
  }
}

/**
 * Handle customer creation
 * Update user with Stripe customer ID if needed
 */
async function handleCustomerCreated(customer) {
  // Find user by email or metadata
  const user = await authModel.findOne({ email: customer.email });
  if (user && !user.stripeCustomerId) {
    user.stripeCustomerId = customer.id;
    await user.save();
  }
}

/**
 * Handle customer updates
 * Usually no action needed, but good for logging
 */
async function handleCustomerUpdated(customer) {
  // Customer updated - no action needed
}

/**
 * Handle trial ending (3 days before trial expires)
 * This gives users a heads up that their trial is ending
 */
async function handleTrialEnding(subscription) {
  const { userId, userType, billingCycle } = subscription.metadata;

  const user = await authModel.findById(userId);
  if (!user) {
    return;
  }

  // Update trial status to indicate it's ending soon
  user.trialStatus = 'ending_soon';
  await user.save();



  // TODO: Send email notification to user about trial ending
  // You can implement email notification logic here
}

/**
 * Handle payment failure after trial period
 * This occurs when the trial ends and the first payment fails
 */
async function handlePaymentFailed(invoice) {
  // Only handle payment failures for subscriptions (not one-time payments)
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const { userId } = subscription.metadata;

    const user = await authModel.findById(userId);
    if (!user) {
      return;
    }

    // Update user status to indicate payment issue
    user.trialStatus = 'payment_failed';
    await user.save();

    // TODO: Send email notification to user about payment failure
    // You can implement email notification logic here
  }
}

/**
 * Get trial information for the current user
 * Useful for displaying trial countdown and status
 */
exports.getTrialInfo = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  // Get user details
  const user = await authModel.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if user has an active subscription
  if (!user.isSubscribed) {
    return res.status(200).json(
      new ApiResponse(200, {
        hasTrial: false,
        trialStatus: 'none',
        trialEndDate: null,
        daysRemaining: 0
      }, "User has no active subscription or trial")
    );
  }

  // Get trial information from user record
  const trialInfo = {
    hasTrial: user.trialStatus && user.trialStatus !== 'none',
    trialStatus: user.trialStatus || 'none',
    trialEndDate: user.trialEndDate,
    daysRemaining: user.trialEndDate ? Math.ceil((user.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
  };

  return res.status(200).json(
    new ApiResponse(200, trialInfo, "Trial information retrieved successfully")
  );
});

/**
 * Debug endpoint to check subscription status
 * This helps troubleshoot subscription issues
 */
exports.debugSubscriptionStatus = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  // Get user details
  const user = await authModel.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Get Stripe subscription details if available
  let stripeSubscription = null;
  if (user.stripeCustomerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'all',
        limit: 5
      });

      stripeSubscription = subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        current_period_end: new Date(sub.current_period_end * 1000),
        metadata: sub.metadata
      }));
    } catch (error) {
      // Error fetching Stripe subscriptions
    }
  }

  // Get subscription details from subscriptions collection
  let dbSubscription = null;
  try {
    dbSubscription = await subscriptionModel.findOne({
      user_id: _id,
      isActive: true,
      is_cancelled: false
    }).sort({ createdAt: -1 });
  } catch (error) {
    // Error fetching subscription from database
  }

  const debugInfo = {
    user: {
      _id: user._id,
      email: user.email,
      isSubscribed: user.isSubscribed,
      trialStatus: user.trialStatus,
      trialEndDate: user.trialEndDate,
      stripeCustomerId: user.stripeCustomerId
    },
    stripeSubscriptions: stripeSubscription,
    dbSubscription: dbSubscription,
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(
    new ApiResponse(200, debugInfo, "Debug information retrieved successfully")
  );
});

/**
 * Get subscription details from subscriptions collection
 * This endpoint provides subscription data for the frontend
 */
exports.getSubscriptionDetails = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  // Get user details
  const user = await authModel.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if user has an active subscription
  if (!user.isSubscribed) {
    return res.status(200).json(
      new ApiResponse(200, {
        isSubscribed: false,
        subscriptionDetails: null
      }, "User has no active subscription")
    );
  }

  // Get subscription details from subscriptions collection
  let subscriptionDetails = null;
  try {
    const subscription = await subscriptionModel.findOne({
      user_id: _id,
      isActive: true,
      is_cancelled: false
    }).sort({ createdAt: -1 });

    if (subscription) {
      subscriptionDetails = {
        id: subscription._id,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        packagePrice: subscription.total_paid,
        subscriptionDate: subscription.subscription_date,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        isActive: subscription.isActive,
        billingReason: subscription.billing_reason,
        // Trial information
        isTrialing: user.trialStatus === 'active',
        trialEnd: user.trialEndDate,
        trialDaysRemaining: user.trialEndDate ? Math.ceil((user.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
      };
    }
  } catch (error) {
    // Error fetching subscription details
  }

  return res.status(200).json(
    new ApiResponse(200, {
      isSubscribed: true,
      subscriptionDetails
    }, "Subscription details retrieved successfully")
  );
});

/**
 * Get user's current subscription status and details
 */
exports.getUserSubscriptionStatus = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  // Get user details
  const user = await authModel.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }



  // Check if user has an active subscription
  if (!user.isSubscribed) {
    return res.status(200).json(
      new ApiResponse(200, {
        isSubscribed: false,
        subscriptionDetails: null
      }, "User has no active subscription")
    );
  }

  // Get detailed subscription information from Stripe
  let subscriptionDetails = null;

  if (user.stripeCustomerId) {
    try {
      // Get customer's subscriptions from Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        const price = subscription.items.data[0]?.price;

        subscriptionDetails = {
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          price: price ? price.unit_amount / 100 : null,
          currency: price ? price.currency : null,
          interval: price ? price.recurring?.interval : null,
          intervalCount: price ? price.recurring?.interval_count : null,
          // Trial information
          isTrialing: subscription.status === 'trialing',
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          trialDaysRemaining: subscription.trial_end ? Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) : null
        };
      }
    } catch (stripeError) {
      // Continue with basic subscription info even if Stripe call fails
    }
  }

  return res.status(200).json(
    new ApiResponse(200, {
      isSubscribed: true,
      subscriptionDetails
    }, "User subscription status retrieved successfully")
  );
});

// Keep the old createPaymentIntent for backward compatibility (deprecated)
exports.createPaymentIntent = async (req, res) => {
  try {
    const { priceId } = req.body;
    const { _id } = req.user;

    const user = await authModel.findById(_id);

    let stripeCustomerId = user.stripeCustomerId;

    // Create Stripe customer if not already created
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
      });

      stripeCustomerId = customer.id;

      // Update the user with the new Stripe customer ID
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    // Create a subscription for the customer
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    const paymentIntent = subscription.latest_invoice.payment_intent;

    res.status(200).json({ clientSecret: paymentIntent.client_secret, success: true });
  } catch (error) {
    res.status(500).json({ message: "Payment failed", error: error.message });
  }
};

// Cancel Stripe subscription (for admin use)
exports.cancelSubscriptionByAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  // Get user details
  const user = await authModel.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.stripeCustomerId) {
    return res.status(200).json(
      new ApiResponse(200, {
        message: "User has no Stripe subscription to cancel"
      }, "No subscription to cancel")
    );
  }

  try {
    // Get active subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active'
    });

    if (subscriptions.data.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, {
          message: "No active subscriptions found"
        }, "No active subscriptions to cancel")
      );
    }

    // Cancel all active subscriptions immediately
    const cancelPromises = subscriptions.data.map(subscription =>
      stripe.subscriptions.cancel(subscription.id, {
        prorate: false,
        invoice_now: false
      })
    );

    await Promise.all(cancelPromises);

    // Update user subscription status
    await authModel.findByIdAndUpdate(userId, {
      isSubscribed: false,
      stripeCustomerId: null
    });

    return res.status(200).json(
      new ApiResponse(200, {
        message: "Subscription cancelled successfully"
      }, "Subscription cancelled and access revoked")
    );

  } catch (error) {
    throw new ApiError(500, `Failed to cancel subscription: ${error.message}`);
  }
});
