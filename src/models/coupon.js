const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["FREE_ACCESS", "DISCOUNT"],
      default: "FREE_ACCESS"
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    isActive: {
      type: Boolean,
      default: true
    },
    maxUses: {
      type: Number,
      default: 1
    },
    usedCount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true
    },
    usedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "auth"
      },
      usedAt: {
        type: Date,
        default: Date.now
      }
    }],
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date,
      default: function () {
        // Default to 1 year from creation
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date;
      }
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1 });
CouponSchema.index({ validUntil: 1 });

// Method to check if coupon is valid
CouponSchema.methods.isValid = function () {
  const now = new Date();
  return this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    this.usedCount < this.maxUses;
};

// Method to use coupon
CouponSchema.methods.useCoupon = function (userId) {
  if (!this.isValid()) {
    throw new Error("Coupon is not valid");
  }

  this.usedCount += 1;
  this.usedBy.push({ user: userId });
  return this.save();
};

const CouponModel = mongoose.model("coupon", CouponSchema);

module.exports = CouponModel;
