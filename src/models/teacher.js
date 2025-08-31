const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const teacherSchema = new Schema(
  {
    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
    },
    grade: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
    }],
    feedback: {
      total: Number,
      counts: {
        1: Number,
        2: Number,
        3: Number,
        4: Number,
        5: Number,
      },
      average:Number
    },
    students:[
      {
          type: mongoose.Schema.Types.ObjectId,
      ref:"Student"
      }
  ],
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const teacherModel = mongoose.model("Teacher", teacherSchema);
module.exports = teacherModel;
