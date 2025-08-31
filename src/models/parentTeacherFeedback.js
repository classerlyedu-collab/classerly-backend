const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const ParentTeacherFeedbackSchema = new Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    comment: {
      type: String,
      required: true
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  {
    timestamps: true
  }
);

const ParentTeacherFeedbackModel = mongoose.model("ParentTeacherFeedback", ParentTeacherFeedbackSchema);
module.exports = ParentTeacherFeedbackModel; 