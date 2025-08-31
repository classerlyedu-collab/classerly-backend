const express = require("express");
const bodyParser = require("body-parser");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Subscription = require("../models/subscription"); // Your MongoDB model
const Invoice = require("../models/invoice"); // Your MongoDB model
const authModel = require("../models/auth");

const router = express.Router();

// Webhook secret from Stripe Dashboard
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const teacherYearlySubscriptionWithStudent = process.env.STRIPE_TEACHER_WITH_STUDENT_ACCESS_PRICE_ID

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {

  let event;
  const sig = req.headers["stripe-signature"];

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // case "invoice.payment_succeeded": {
      //   const invoice = event.data.object;
      //   const stripeSubscriptionId = invoice.subscription;

      //   // Update invoice record in MongoDB
      //   await Invoice.create({
      //     stripe_subscription_id: stripeSubscriptionId,
      //     stripe_pdf_url: invoice.hosted_invoice_url,
      //     stripe_invoice_id: invoice.id,


      //     total_Paid: invoice.amount_paid / 100, // Convert cents to dollars
      //   });
      //   const session = event.data.object;
      //   const customerId = session.customer; // Stripe Customer ID

      //   // Find user by Stripe Customer ID and update isSubscribed to true
      //   await authModel.findOneAndUpdate(
      //     { stripeCustomerId: customerId },
      //     { isSubscribed: true },


      //   );

      //   // console.log(`User with Stripe ID ${customerId} subscription activated.`);
      //   // console.log(`Invoice ${invoice.id} recorded successfully.`);
      //   break;
      // }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const stripeSubscriptionId = invoice.subscription;
        const customerId = invoice.customer; // Stripe Customer ID

        // Check if the purchased product includes teacherYearlySubscriptionWithStudent
        const hasTeacherWithStudentsPlan = invoice.lines.data.some((line) =>
          line.price.id === teacherYearlySubscriptionWithStudent
        );

        // Update invoice record in MongoDB
        await Invoice.create({
          stripe_subscription_id: stripeSubscriptionId,
          stripe_pdf_url: invoice.hosted_invoice_url,
          stripe_invoice_id: invoice.id,
          total_Paid: invoice.amount_paid / 100, // Convert cents to dollars
        });

        // Update user subscription status and plan if applicable
        const updateData = { isSubscribed: true };
        if (hasTeacherWithStudentsPlan) {
          updateData.plan = "allowToRegisterMultiStudents"; // Set plan only for this product
        }

        await authModel.findOneAndUpdate(
          { stripeCustomerId: customerId },
          updateData
        );

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const stripeSubscriptionId = subscription.id;

        // Update Subscription in MongoDB
        await Subscription.findOneAndUpdate(
          { stripe_subscription_id: stripeSubscriptionId },
          {
            isActive: subscription.status === "active",
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            total_paid: subscription.plan.amount / 100,
          },
          { upsert: true }
        );

        const session = event.data.object;
        const customerId = session.customer; // Stripe Customer ID

        // Find user by Stripe Customer ID and update isSubscribed to true
        await authModel.findOneAndUpdate(
          { stripeCustomerId: customerId },
          { isSubscribed: true },
        );

        console.log(`Subscription ${stripeSubscriptionId} updated successfully.`);
        break;
      }

      // case "customer.subscription.deleted": {
      //   const subscription = event.data.object;
      //   const stripeSubscriptionId = subscription.id;

      //   // Mark subscription as inactive
      //   await Subscription.findOneAndUpdate(
      //     { stripe_subscription_id: stripeSubscriptionId },
      //     { isActive: false }


      //   );

      //   // Find user by Stripe Customer ID and update isSubscribed to true
      //   await authModel.findOneAndUpdate(
      //     { stripeCustomerId: stripeSubscriptionId },
      //     { isSubscribed: false },
      //   );

      //   break;
      // }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const stripeSubscriptionId = subscription.id;

        // Mark subscription as inactive
        await Subscription.findOneAndUpdate(
          { stripe_subscription_id: stripeSubscriptionId },
          { isActive: false }
        );

        // Find the user whose subscription is being canceled
        const user = await authModel.findOneAndUpdate(
          { stripeCustomerId: stripeSubscriptionId },
          { isSubscribed: false }
        );

        if (user) {
          // Update all users who used this user's coupon
          await authModel.updateMany(
            { couponProvider: user._id },
            { isSubscribed: false }
          );
        }

        break;
      }


      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).send("Webhook received.");
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;