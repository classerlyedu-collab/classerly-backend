const mongoose = require("mongoose");
const gradeSchema = mongoose.Schema(
  {
    grade: {
      type: String,
      unique: true
    },
    image:String,
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
      }
    ],
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher"
      }
    ],
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject"
      }
    ]
  },
  { timestamps: true }
);
const gradeModel = mongoose.model("Grade", gradeSchema);
module.exports = gradeModel;