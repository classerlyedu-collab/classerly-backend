const gamesModel = require("../models/games");
const gradeModel = require("../models/grade.models");
const StudentgamesModel = require("../models/studentgames.model");
const subjectModel = require("../models/subject");
const topicModel = require("../models/topic");

exports.addgame = async (req, res) => {
  try {
    const {
      grade,
      topic,
      subject,
      title,
      score,

      image,
    } = req.body;
    const gradedata = await gradeModel.findById(grade);

    if (!gradedata) {
      throw new Error("Grade not found");
    }
    // const lessondata = await LessonsModel.findById(lesson);

    // if (!lessondata) {
    //   throw new Error("Lesson not found");
    // }

    const topicdata = await topicModel.findById(topic);

    if (!topicdata) {
      throw new Error("Topic not found");
    }
    const subjectdata = await subjectModel.findById(subject);

    if (!subjectdata) {
      throw new Error("Subject not found");
    }
    const data = await new gamesModel({
      createdBy: req.user?.profile?._id,
      grade,
      topic,
      subject,
      score,
      title,
      image,
    }).save();
    return res
      .status(200)
      .json({ success: true, messgae: "Game added successfully", data });
  } catch (err) {
    return res.status(200).json({ success: false, message: err.message });
  }
};

exports.getgame = async (req, res) => {
  try {
    const { grade } = req.query;
    let data = await gamesModel
      .find({ grade })
      .populate({
        path: "createdBy",
        select: "auth",
        populate: {
          path: "auth",
          select: ["userName", "fullName", "email", "userType"],
        },
      })
      .populate({ path: "subject", select: ["_id", "image", "name"] })
      .populate({
        path: "topic",
        select: ["_id", "image", "name", "difficulty", "type"],
      })
      .populate({
        path: "grade",
        select: ["grade"],
      });
    return res
      .status(200)
      .json({ success: true, messgae: "Games get successfully", data });
  } catch (err) {
    return res.status(200).json({ success: false, message: err.message });
  }
};

exports.studentgame = async (req, res) => {
  try {
    const { id } = req.params;

    let data = await StudentgamesModel.findOneAndUpdate(
      {
        student: req.user?.profile?._id,
        game: id,
      },
      {
        $set: {
          status: "complete",
          result: "pass",
          score: score,
        },
      },
      { upsert: true }
    );
    return res
      .status(200)
      .json({ success: true, messgae: "Game complleted successfully", data });
  } catch (err) {
    return res.status(200).json({ success: false, message: err.message });
  }
};
