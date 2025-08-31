const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const bcrypt = require("bcrypt");
// ######################## Topic Schema #####################
const AuthSchema = new Schema(
  {
    fullName: { type: String },
    userName: { type: String, unique: true },
    email: { type: String, unique: true },
    password: { type: String },
    isBlocked: { type: Boolean, default: false },
    userType: {
      type: String,
      enum: ["Admin", "Teacher", "Student", "Parent"],
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "userType",
    },
    image: { type: String, default: "" },
    fullAddress: String,
    otp: String,
    emailNotification: { type: Boolean, default: true },
    notification: { type: Boolean, default: true },
    isSubscribed: { type: Boolean, default: false },
    stripeCustomerId: { type: String },
    // Trial-related fields
    trialStatus: {
      type: String,
      enum: ['none', 'active', 'ending_soon', 'completed', 'payment_failed', 'past_due'],
      default: 'none'
    },
    trialEndDate: { type: Date },
    couponUsed: { type: Boolean },
    couponProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
    },
    plan: { type: String },
    couponClosed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);
AuthSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  }
});
const authModel = mongoose.model("auth", AuthSchema);
module.exports = authModel;
