const mongoose = require("mongoose");

const StudentgamesSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "games",
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
   
   
    score: { type: Number, default: 0 },
    marks: { type: Number, default: 0 },    

  },
  {
    timestamps: true,
  }
);

const StudentgamesModel = mongoose.model("Studentgames", StudentgamesSchema);
module.exports = StudentgamesModel;
