const mongoose = require("mongoose");

const studentquizesSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quizes",
    },

    status: {
      type: String,
      enum: ["start", "complete","result"],
      default: "start",
    },
    result: {
      type: String,
      enum: ["awaiting", "pass", "fail"],
      default: "awaiting",
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Questions",
      },
    ],
    answers: [{ type: String }],
    score: { type: Number, default: 0 },
    marks: { type: Number, default: 0 },

  },
  {
    timestamps: true,
  }
);

const StudentquizesModel = mongoose.model("studentquizes", studentquizesSchema);
module.exports = StudentquizesModel;
