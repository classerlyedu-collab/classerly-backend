const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const studentSchema = new Schema(
  {
    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth"
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
      },
    ],
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade"
    },
    code: {
      type: String,
      unique: true
    },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "parent" },
    opinionEmail: {
      type: Boolean
    },
    reminderEmail: {
      type: Boolean
    },
    newEmail: {
      type: Boolean
    },
    reminder: {
      type: Boolean
    },
    quizReminder: {
      type: Boolean
    },
    gamesReminder: {
      type: Boolean
    },
    feedback: {
      total: Number,
      counts: {
        1: Number,
        2: Number,
        3: Number,
        4: Number,
        5: Number
      },
      average: Number
    }
  },
  {
    timestamps: true
  }
);

const studentModel = mongoose.model("Student", studentSchema);
module.exports = studentModel;
