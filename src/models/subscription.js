const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    package_id: {
      type: mongoose.Types.ObjectId,
      ref: "Package",
    },
    user_id: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    stripe_subscription_id: {
      type: String,
    },
    total_paid: {
      type: Number,
    },
    subscription_date: {
      type: Date,
    },
    isActive: {
      type: Boolean,
    },
    invoice_url: {
      type: String,
    },
    invoice_pdf: {
      type: String,
    },
    billing_reason: {
      type: String,
    },
    current_period_end: {
      type: Date,
    },
    current_period_start: {
      type: Date,
    },
    is_cancelled: {
      type: Boolean,
      default: false,
    },
    cancelled_at: {
      type: Date,
    },
    expired: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
