const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const NotificationSchema = new Schema(
  {
    forAll:{type:Boolean,defaul:false},
    forType: {
      type: String,
      enum: ["Student", "Teacher", "Parent"],
      required: true,
    },

    for: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: "Student",
      required: true,
      refPath: "forType",
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const NotificationModel = mongoose.model("Notification", NotificationSchema);

module.exports = NotificationModel;
