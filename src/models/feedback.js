const mongoose = require("mongoose");

const { Schema } = require("mongoose");
const teacherModel = require("./teacher");
const studentModel = require("./student");

const FeedbackSchema = new Schema(
  {
    fromType: {
      type: String,
      enum: ["Student", "Teacher"],
      required: true
    },
    toType: {
      type: String,
      enum: ["Student", "Teacher"],
      required: true
    },

    from: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: "Student",
      required: true,
      refPath: "fromType"
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: "Teacher",
      required: true,
      refPath: "toType"
    },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade"
    },
    feedback: {
      type: String
    },
    star: Number
  },
  {
    timestamps: true
  }
);

const FeedbackModel = mongoose.model("feedback", FeedbackSchema);
const changeStream = FeedbackModel.watch();
changeStream.on("change", async (change) => {
  let techerfeedback,studentfeedback;

  if (change?.operationType == "update" || change?.operationType == "delete") {
    techerfeedback = await FeedbackModel.find({
      toType:"Teacher",
      to: (
        await FeedbackModel.findOne({ _id: change.documentKey._id })
      )?.to
    });
    studentfeedback = 
    await FeedbackModel.find({
      toType:"Student",
      to: (
        await FeedbackModel.findOne({ _id: change.documentKey._id })
      )?.to
    });
  } else {
    techerfeedback = await FeedbackModel.find({
      toType:"Teacher",
      to: change?.fullDocument?.to
    });
    studentfeedback = await FeedbackModel.find({
      toType:"Student",
      to: change?.fullDocument?.to
    });
  }


  if (techerfeedback.length>0) {
    await teacherModel.findOneAndUpdate(
      { _id: techerfeedback[0]?.to },
      {
        feedback: {
          total: techerfeedback.length,
          counts: {
            1: techerfeedback.filter((i) => {
              return i.star == 1;
            }).length,
            2: techerfeedback.filter((i) => {
              return i.star == 2;
            }).length,

            3: techerfeedback.filter((i) => {
              return i.star == 3;
            }).length,
            4: techerfeedback.filter((i) => {
              return i.star == 4;
            }).length,
            5: techerfeedback.filter((i) => {
              return i.star == 5;
            }).length
          },
          average:
            techerfeedback.reduce((accumulator, currentValue) => {
              return accumulator + currentValue.star;
            }, 0) / techerfeedback?.length
        }
      }
    );
  }
  if(studentfeedback.length>0){
    await studentModel.findOneAndUpdate(
      { _id: studentfeedback[0]?.to },
      {
        feedback: {
          total: studentfeedback.length,
          counts: {
            1: studentfeedback.filter((i) => {
              return i.star == 1;
            }).length,
            2: studentfeedback.filter((i) => {
              return i.star == 2;
            }).length,

            3: studentfeedback.filter((i) => {
              return i.star == 3;
            }).length,
            4: studentfeedback.filter((i) => {
              return i.star == 4;
            }).length,
            5: studentfeedback.filter((i) => {
              return i.star == 5;
            }).length
          },
          average:
          studentfeedback.reduce((accumulator, currentValue) => {
              return accumulator + currentValue.star;
            }, 0) / studentfeedback?.length
        }
      }
    );
  }
});
module.exports = FeedbackModel;
