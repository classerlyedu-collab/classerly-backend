const LessonsModel = require("../models/LessonsModel");
const gradeModel = require("../models/grade.models");
const QuestionsModel = require("../models/questions");
const QuizesModel = require("../models/quizes");
const StudentquizesModel = require("../models/studentquizes");
const subjectModel = require("../models/subject");
const topicModel = require("../models/topic");
const asyncHandler = require("../utils/asyncHandler");

exports.addquiz = asyncHandler(async (req, res) => {
  try {
    const {
      grade,
      topic,
      subject,
      startsAt,
      endsAt,
      score,
      questions,
      lesson,
      image,
      type
    } = req.body;
    const gradedata = await gradeModel.findById(grade);

    if (!gradedata) {
      throw new Error("Grade not found");
    }
    const lessondata = await LessonsModel.findById(lesson);

    if (!lessondata) {
      throw new Error("Lesson not found");
    }

    const topicdata = await topicModel.findById(topic);

    if (!topicdata) {
      throw new Error("Topic not found");
    }
    const subjectdata = await subjectModel.findById(subject);

    if (!subjectdata) {
      throw new Error("Subject not found");
    }
    const data = new QuizesModel({
      createdBy: req.user?.profile?._id,
      type: type ?? 'universal',
      grade,
      topic,
      subject,
      lesson,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      score,
      image,
    });
    let questionarr = [];
    await Promise.all(
      questions.map(async (item) => {
        const { question, options, answer, score } = item;
        let quiz = data._id;
        let questiondata = await new QuestionsModel({
          question,
          options,
          answer,
          score,
          quiz,
        }).save();
        questionarr.push(questiondata._id);
      })
    );
    data.questions = questionarr;
    await data.save();
    return res.send({
      success: true,
      data,
      message: "Quiz added successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});

exports.updatequiz = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const quizdata = await QuizesModel.findById(id);
    if (!quizdata) {
      throw new Error("Invalid id");
    }
    const { grade, topic, subject, lesson, startsAt, endsAt, score } = req.body;
    const gradedata = grade ?? (await gradeModel.findById(grade));

    if (!gradedata) {
      throw new Error("Grade not found");
    }
    const topicdata = await topicModel.findById(topic);

    if (!topicdata) {
      throw new Error("Topic not found");
    }
    const subjectdata = await subjectModel.findById(subject);

    if (!subjectdata) {
      throw new Error("Subject not found");
    }
    const lessondata = await gradeModel.findById(lesson);

    if (!lessondata) {
      throw new Error("Lesson not found");
    }
    let { questions } = req.body
    delete req.body.questions
    const data = await QuizesModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    let newQuestions = await Promise.all(questions.map(async (question) => {

      return await QuestionsModel.findOneAndUpdate({
        question,
        quiz,
      }, {
        question,
        options,
        answer,
        score,
        quiz,
      }, { upsert: true }, { new: true })
    }))
    return res.send({
      success: true,
      data: { ...data, ...newQuestions },
      message: "Quize Update Successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});
exports.deletequiz = asyncHandler(async (req, res) => {
  try {
    return res.send({
      success: true,
      data: feedbackdata,
      message: "Feedback done successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});
exports.addquestion = asyncHandler(async (req, res) => {
  try {
    const { quiz, question, options, answer, score } = req.body;
    const quizdata = await QuizesModel.findOne({
      _id: quiz,
      createdBy: req.user?.profile?._id,
    });

    if (!quizdata) {
      throw new Error("Invalid Quiz Id");
    }
    let questiondata = await new QuestionsModel({
      question,
      options,
      answer,
      score,
      quiz,
    }).save();
    quizdata.questions.push(questiondata._id);
    await quizdata.save();

    return res.send({
      success: true,
      data: quizdata,
      message: "Question added successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});
exports.updatequestion = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { quiz } = req.body;
    const questiondata = await QuestionsModel.findOne({
      _id: id,
      quiz,
    });

    if (!questiondata) {
      throw new Error("Invalid Question Id");
    }
    let questionupdate = await QuestionsModel.findOneAndUpdate(
      { _id: id, quiz },
      req.body,
      { new: true }
    );

    return res.send({
      success: true,
      data: questionupdate,
      message: "Question updated successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});
exports.deletequestions = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { quiz } = req.query;
    const questiondata = await QuestionsModel.findOne({
      _id: id,
      quiz,
    });

    if (!questiondata) {
      throw new Error("Invalid Question Id");
    }
    let questionupdate = await QuestionsModel.findOneAndDelete({
      _id: id,
      quiz,
    });

    return res.send({
      success: true,
      data: questionupdate,
      message: "Question deleted successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});

exports.updatestatusquiz = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const quizdata = await QuizesModel.findById(id).populate("questions");
    if (!quizdata) {
      throw new Error("Invalid id");
    }
    const studentdata = await StudentquizesModel.findOne({
      quiz: id,
      student: req.user?.profile?._id,
    });
    if (status == "start") {
      // const alreadyquiz = await StudentquizesModel.findOne({
      //   quiz: id,
      //   student: req.user.profile._id,
      // });
      // if (alreadyquiz) {
      //   throw new Error("Already done quiz");
      // }
      const quizsdata = await StudentquizesModel.findOneAndUpdate(
        {
          quiz: id,
          student: req.user.profile._id,
        },
        {
          questions: quizdata.questions,
          score: quizdata.score,
          marks: 0,
        },
        { upsert: true }, { new: true }
      );
      // const quizsdata = await new StudentquizesModel({
      //   quiz: id,
      //   student: req.user.profile._id,
      //   questions: quizdata.questions,
      //   score: quizdata.score,
      // }).save();
      return res.send({
        success: true,
        data: quizsdata,
        message: "Quiz started successfully",
      });
    } else if (status === "end") {
      let marks = 0,
        score = 0;

      console.log(`[QUIZ END] Processing quiz completion for quiz ID: ${id}, student: ${req.user.profile._id}`);

      const questions = quizdata.questions;
      const answers = studentdata.answers;

      // Use for-loop instead of .map for async/await to work correctly
      for (let index = 0; index < questions.length; index++) {
        const q = questions[index];
        const studentAnswer = answers[index];

        const correct = normalizeAnswer(q.answer, q.options);
        const submitted = normalizeAnswer(studentAnswer, q.options);

        console.log(`[QUESTION ${index + 1}] Correct: ${correct}, Student Answer: ${submitted}`);

        if (correct === submitted) {
          marks += q.score;
          console.log(`[QUESTION ${index + 1}] ✅ Correct — Marks: ${marks}`);
        } else {
          console.log(`[QUESTION ${index + 1}] ❌ Incorrect`);
        }

        score += q.score;
      }

      const percentage = (marks / score) * 100;
      const result = percentage > 70 ? "pass" : "fail";

      console.log(`[QUIZ COMPLETE] Total Marks: ${marks}, Total Score: ${score}, Percentage: ${percentage.toFixed(2)}%, Result: ${result}`);

      try {
        const quizsdata = await StudentquizesModel.findOneAndUpdate(
          {
            quiz: id,
            student: req.user.profile._id,
          },
          {
            status: "complete",
            result,
            marks,
            score,
          },
          { new: true }
        );

        console.log(`[DB UPDATE] Quiz data updated successfully for student ${req.user.profile._id}`);

        return res.send({
          success: true,
          data: { ...quizsdata._doc, marks, score },
          message: "Quiz Completed successfully",
        });
      } catch (error) {
        console.error(`[ERROR] Failed to update quiz result: ${error.message}`, error);
        return res.status(500).send({
          success: false,
          message: "Something went wrong while completing the quiz",
        });
      }
    }
    else {
      throw Error("Invalid reqt");
    }
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});

exports.getquizes = asyncHandler(async (req, res) => {
  try {

    let { limit, page } = req.query;
    delete req.query.limit;
    delete req.query.page;
    page = page || 0;
    limit = limit || 10;
    const cleanObject = (obj) => {
      return Object.fromEntries(
        Object.entries(obj).filter(
          ([key, value]) => value !== null && value !== "null" && value !== ""
        )
      );
    };

    req.query = cleanObject(req.query);

    let Quizdata = await QuizesModel.find(req.query)
      // .skip(page * limit)
      // .limit(limit)
      .populate({ path: "questions" })
      .populate({
        path: "createdBy",
        select: "auth",
        populate: {
          path: "auth",
          select: ["userName", "fullName", "email", "userType"],
        },
      })
      .populate({ path: "grade", select: ["_id", "grade"] })
      .populate({ path: "subject", select: ["_id", "image", "name"] })
      .populate({
        path: "topic",
        select: ["_id", "image", "name", "difficulty", "type"],
      })
      .populate({ path: "lesson", select: ["_id", "image", "name"] })
      .sort({ _id: -1 });

    if (req.user.userType == "Teacher") {

      if (Quizdata.length > 0) {
        return res.send({
          success: true,
          data: Quizdata,
          message: "Quizes get successfully",
        });
      } else {
        return res.send({
          success: false,
          data: [],
          message: "Quizes not found",
        });
      }
    } else {
      if (Quizdata.length > 0) {
        return res.send({
          success: true,
          data: Quizdata.map((i) => {
            return {
              ...i._doc,
              questions: i.questions.map((j) => {
                delete j.answer
                return j._doc
              })
            }
          }),
          message: "Quizes get successfully",
        });
      } else {
        return res.send({
          success: false,
          data: [],
          message: "Quizes not found",
        });
      }
    }
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});

exports.getMyQuizesByResult = asyncHandler(async (req, res) => {
  try {
    const { result } = req.query
    let data = await StudentquizesModel.find({
      result,
      student: req.user?.profile?._id,
    }, { questions: 0, answers: 0 })
      .populate({
        path: "quiz"
      })
      .populate({
        path: "quiz", populate: {
          path: "questions",
          // select:"-answer"
        }
      })

      .populate({ path: "quiz", populate: { path: "grade", select: "grade" } })
      .populate({ path: "quiz", populate: { path: "topic", select: "name" } })
      .populate({ path: "quiz", populate: { path: "subject", select: "name" } })
      .populate({ path: "quiz", populate: { path: "lesson", select: "name" } })

    // .populate({ path: "quiz", populate: {
    //   path:["grade","subject","lesson","topic"]
    // } })


    return res.send({
      success: true,
      data,
      message: "Student Quizes found successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});
exports.addananswer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { answer, index } = req.body;

    const studentquizdata = await StudentquizesModel.findOne({
      quiz: id,
      student: req.user?.profile?._id,
      // status: "start",
    });
    if (!studentquizdata) {
      throw Error("Invalid quiz");
    }
    if (index > studentquizdata.questions.length) {
      throw Error("Invalid index");
    }
    studentquizdata.answers[index] = answer;
    await studentquizdata.save();
    return res.send({
      success: true,
      data: studentquizdata,
      message: "Answer done successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});
exports.getstudentquizesbyquizid = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const studentquizdata = (
      await StudentquizesModel
        // .aggregate([
        //     {
        //         $lookup:{
        //             from: "students",
        //             localField: "student",
        //             foreignField: "_id",
        //             as: "student"
        //         }
        //     },
        //     {
        //         $lookup:{
        //             from: "quizes",
        //             localField: "quiz",
        //             foreignField: "_id",
        //             as: "quiz_details"
        //         }
        //     },
        //     {
        //         $lookup:{
        //             from: "questions",
        //             localField: "questions",
        //             foreignField: "_id",
        //             as: "questions"
        //         }
        //     },
        //     {
        //         $unwind: "$quiz_details"
        //       }, {
        //         $match: {
        //           "quiz_details.created_By": req.user?.profile?._id,
        //           status:"complete",
        //           quiz: id,
        //           ...req.query

        //         }
        //       },
        //       {$project:{
        //         "quiz.answer":0
        //       }}
        // ])
        .find({
          quiz: id,
          //   "quiz.createdBy": req.user?.profile?._id,
          status: "complete",
          ...req.query,
        })
        .populate({ path: "quiz", select: "-answer" })
        .populate("student")
        .populate("questions")
    ).filter((i) => {
      return i.quiz.createdBy == req.user?.profile?._id;
    });
    if (studentquizdata.length > 0) {
      return res.send({
        success: true,
        data: studentquizdata,
        message: "Student Quizes done successfully",
      });
    }
    return res.send({
      success: false,
      data: [],
      message: "Student Quizes not found",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});

exports.updatestudentquize = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { score, result } = req.body;
    const studentquizdata = await StudentquizesModel.findById(id).populate([
      "questions",
      "quiz",
      "student",
    ]);

    if (
      !studentquizdata &&
      studentquizdata.quiz.createdBy != req.user?.profile?._id
    ) {
      throw Error("Student Quiz is invalid");
    }
    if (score > studentquizdata.quiz?.score) {
      throw Error("Invalid score");
    }
    studentquizdata.score = score;
    studentquizdata.result = result;
    studentquizdata.status = "result";
    await studentquizdata.save();

    return res.send({
      success: true,
      data: studentquizdata,
      message: "Student Quizes updated successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
});



const normalizeAnswer = (answer, options) => {
  if (!answer) return "";

  const cleaned = answer.trim().toLowerCase();

  // If answer is A/B/C/D → convert to full text using options
  if (["a", "b", "c", "d"].includes(cleaned)) {
    const index = cleaned.charCodeAt(0) - 97; // a=0, b=1, etc.
    return options[index]?.trim().toLowerCase() || "";
  }

  return cleaned;
};