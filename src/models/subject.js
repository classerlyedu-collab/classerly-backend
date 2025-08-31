const mongoose = require("mongoose");
const { Schema } = require("mongoose");

// ######################## Subject Schema #####################
const subjectSchema = new Schema(
  {
    name: { type: String },
    image: String,

    topics: [
      {
        type: Schema.Types.ObjectId,
        ref: "Topic",
      },
    ],
    teachers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Teacher",
      },
    ],
    grade: {
      type: Schema.Types.ObjectId,
      ref: "Grade",
    },
  },
  {
    timestamps: true,
  }
);

const subjectModel = mongoose.model("subject", subjectSchema);
module.exports = subjectModel;
