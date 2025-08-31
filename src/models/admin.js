const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const adminSchema = new Schema(
  {
    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
    },

    code: String,
    // grade is only add for syncronization with other users
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
    },
  },
  {
    timestamps: true,
  }
);

const adminModel = mongoose.model("Admin", adminSchema);
module.exports = adminModel;
