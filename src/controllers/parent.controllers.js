const { json } = require("express");
const ParentModel = require("../models/parent");
const StudentModel = require("../models/student");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const sendEmail = require("../utils/sendemail");
const { isValidObjectId, default: mongoose } = require("mongoose");
// const ApiError = require("../utils/Apierror");
const teacherModel = require("../models/teacher");
const FeedbackModel = require("../models/feedback");
const StudentquizesModel = require("../models/studentquizes");
const studentModel = require("../models/student");
const NotificationModel = require("../models/notification");
const topicModel = require("../models/topic");
const lessonModel = require('../models/LessonsModel');

exports.getMyChildsubjectdata = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Get the student and their subjects
    
    const student = await studentModel
    .findOne({ _id: id })
    .populate({ path: "subjects", select: ["name", "image"] });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const result = [];

    for (const subject of student.subjects) {
      // Step 2: Get topics related to this subject
      const topics = await topicModel.find({ subject: subject._id }).select("_id");

      const topicIds = topics.map((t) => t._id);

      // Step 3: Get all lessons for those topics
      const lessons = await lessonModel.find({ topic: { $in: topicIds } });

      const totalLessons = lessons.length;
      const completedLessons = lessons.filter((lesson) =>
        lesson.readby.includes(id)
      ).length;

      const progress = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      result.push({
        _id: subject._id,
        name: subject.name,
        image: subject.image,
        totalLessons,
        completedLessons,
        progress,
      });
    }

    return res.send({
      success: true,
      data: result,
      message: "Subjects with progress fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addNewChild = asyncHandler(async (req, res) => {
  const { stdid } = req.body;
  //   if (!isValidObjectId(parentId)) {
  //     return res.status(200).json({ message: "Invalid parent ID format" });
  //   }
  try {
    const findParent = await ParentModel.findById({
      _id: req.user.profile._id,
    });
    const child = await StudentModel.findOne({ code: stdid });

    if (!child) {
      return res
        .status(200)
        .json({ success: false, message: "Invalid child Code" });
    }
    if (findParent.childIds.includes(child._id)) {
      return res
        .status(200)
        .json({ success: false, message: "Child Already added" });
    }

    findParent.childIds.push(child._id);
    findParent.save();
    await StudentModel.findOneAndUpdate(
      { code: stdid },
      { parent: findParent._id }
    );
    res
      .status(200)
      .json(new ApiResponse(200, findParent, "child added successfully"));
  } catch (error) {
    console.error("Error in sign-up:");

    res.status(200).json({ message: error.message });
  }
});

exports.getMyChilds = asyncHandler(async (req, res) => {
  try {
    const findMychilds = await ParentModel.findOne({
      _id: req.user?.profile?._id,
    })
      .populate({
        path: "childIds",
        select: "-password",
        populate: {
          path: "grade",
          select: "grade",
          // populate: { path: "subjects", select: ["image", "name"] },
        },
      })
      .populate({
        path: "childIds",
        select: "-password",
        populate: { path: "subjects", select: ["image", "name"] },
      })
      .populate({
        path: "childIds",
        select: "-password",
        populate: { path: "auth", select: "-password" },
      });

    // const findMychilds = await ParentModel.aggregate([
    //   {
    //     $match: {
    //       _id: new mongoose.Types.ObjectId(req.user?.profile?._id),
    //     },
    //   },
    //   {
    //     $unwind: "$childIds",
    //   },
    //   {
    //     $lookup:{
    //       from:"students",
    //       foreignField:"_id",
    //       localField:"childIds",
    //       as:"childern"
    //     }
    //   },
    //   {
    //     $unwind: "$childern",
    //   },
    //   {
    //     $lookup: {
    //       from: "grades",
    //       // foreignField:"_id",
    //       // localField:"childern.grade",
    //       let: { childid: { $toString: "$childern.grade" } }, // Convert _id to string
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $eq: [{ $toString: "$_id"}, "$$childid"], // Convert topic field to string and compare
    //             },
    //           },
    //         },
    //       ],
    //       as: "grade",
    //     },
    //   },
    // ]);

    setTimeout(async () => {
      let childs = findMychilds.childIds;
      // let d =await Promise.all( childs.map(async (i) => {
      //   return {
      //     ...i._doc,subjects:
      //     await Promise.all(
      //       i.subjects.map(async (j) => {
      //         let quiz = await topicModel.aggregate([
      //           {
      //             $match: {
      //               subject: new mongoose.Types.ObjectId(j._id),
      //             },
      //           },
      //           {
      //             $lookup: {
      //               from: "lessons",
      //               let: { topicId: { $toString: "$_id" } }, // Convert _id to string
      //               pipeline: [
      //                 {
      //                   $match: {
      //                     $expr: {
      //                       $eq: [{ $toString: "$topic" }, "$$topicId"], // Convert topic field to string and compare
      //                     },
      //                   },
      //                 },
      //               ],
      //               as: "lessons",
      //             },
      //           },
      //           // {
      //           //   $match:{
      //           //     "lessons.readyby":{$in:[new mongoose.Types.ObjectId(req.user.profile._id)]}
      //           //   }
      //           // },
      //           {
      //             $lookup: {
      //               from: "quizes",
      //               let: { topicId: { $toString: "$_id" } }, // Convert _id to string
      //               pipeline: [
      //                 {
      //                   $match: {
      //                     $expr: {
      //                       $eq: [{ $toString: "$topic" }, "$$topicId"], // Convert topic field to string and compare
      //                     },
      //                   },
      //                 },
      //               ],
      //               as: "quizes",
      //             },
      //           },
      //           {
      //             $unwind: {
      //               path: "$quizes", // Specify the field you want to unwind
      //               preserveNullAndEmptyArrays: true,
      //             },
      //           },

      //           {
      //             $lookup: {
      //               from: "studentquizes",
      //               let: {
      //                 topicId: { $toString: "$quizes._id" },
      //                 stdId: { $toString: i?._id },
      //               }, // Convert _id to string
      //               pipeline: [
      //                 {
      //                   $match: {
      //                     $expr: {
      //                       $and: [
      //                         {
      //                           $eq: [{ $toString: "$quiz" }, "$$topicId"], // Convert topic field to string and compare
      //                         },
      //                         {
      //                           $eq: [{ $toString: "$student" }, "$$stdId"], // Convert topic field to string and compare
      //                         },
      //                       ],
      //                     },
      //                   },
      //                 },
      //               ],
      //               as: "studentquizes",
      //             },
      //           },
      //           {
      //             $group: {
      //               _id: "$_id",
      //               name: { $first: "$name" },

      //               image: { $first: "$image" },

      //               subject: { $first: "$subject" },
      //               difficulty: { $first: "$difficulty" },
      //               type: { $first: "$type" },
      //               lessons: { $first: "$lessons" },

      //               // Group by topic ID
      //               // subject: { $first: "$subject" }, // Keep other fields from the original topic
      //               // name: { $first: "$name" },
      //               quizes: {
      //                 $push: {
      //                   _id: "$quizes._id", // Keep quiz fields
      //                   title: "$quizes.createdBy",
      //                   questions: "$quizes.questions",
      //                   status: "$quizes.status",
      //                   grade: "$quizes.grade",
      //                   topic: "$quizes.topic",
      //                   subject: "$quizes.subject",
      //                   image: "$quizes.image",
      //                   endsAt: "$quizes.endsAt",
      //                   startsAt: "$quizes.startsAt",
      //                   studentQuizData: "$studentquizes", // Embed the student quiz data
      //                 },
      //               },
      //             },
      //           },
      //         ])
      //         return {
      //           ...j._doc,
      //           quiz:quiz.map((q)=>{

      //           }) ,
      //         };
      //       })
      //     )
      //   }

      // }));

      return res
        .status(200)

        .json(new ApiResponse(200, childs, "childs founded succesfully"));
    }, 100);
  } catch (error) {
    return res.status(200).json({ message: error.message });
  }
});

exports.getMyChildbyId = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const findMychilds = await studentModel
      .findOne({
        _id: id,
      })
      .populate(
        ["grade", "auth"]
        // {
        //   path: "grade",
        //   select: ["grade", "subjects"],
        //   // populate: { path: "subjects", select: ["image", "name"] },
        // },
        // { path: "auth", select: "-password" },
      );
    // populate({
    //   path: "childIds",
    //   select: "-password",
    //   populate: [
    //     {
    //       path: "grade",
    //       select: ["grade", "subjects"],
    //       populate: { path: "subjects", select: ["image", "name"] },
    //     },
    //     { path: "auth", select: "-password" },
    //   ],
    // });

    // const childs = findMychilds.childIds;
    return res
      .status(200)
      .json(new ApiResponse(200, findMychilds, "child founded succesfully"));
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
});

exports.getMyChildbysubjectId = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { subject } = req.query;
    if (!subject) {
      return res
        .status(200)
        .json({
          success: false,
          message: "Missing subject Id",
        });
    }
    const findTopicLesson = await topicModel.aggregate([
      {
        $match: {
          subject: new mongoose.Types.ObjectId(subject),
        },
      },
      {
        $lookup: {
          from: "lessons",
          let: { topicId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$topic" }, "$$topicId"],
                },
              },
            },
          ],
          as: "lessons",
        },
      },
      {
        $lookup: {
          from: "quizes",
          let: { topicId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$topic" }, "$$topicId"],
                },
              },
            },
          ],
          as: "quizes",
        },
      },
      {
        $addFields: {
          quizesWithStudent: {
            $map: {
              input: "$quizes",
              as: "quiz",
              in: {
                _id: "$$quiz._id",
                title: "$$quiz.createdBy",
                questions: "$$quiz.questions",
                status: "$$quiz.status",
                grade: "$$quiz.grade",
                topic: "$$quiz.topic",
                subject: "$$quiz.subject",
                image: "$$quiz.image",
                endsAt: "$$quiz.endsAt",
                startsAt: "$$quiz.startsAt",
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: "studentquizes",
          let: { 
            topicQuizIds: {
              $map: {
                input: "$quizes",
                as: "quiz",
                in: { $toString: "$$quiz._id" }
              }
            },
            studentId: id
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: [{ $toString: "$quiz" }, "$$topicQuizIds"] },
                    { $eq: [{ $toString: "$student" }, "$$studentId"] }
                  ]
                }
              }
            },
            {
              $addFields: {
                quizId: { $toString: "$quiz" }
              }
            }
          ],
          as: "studentQuizData"
        }
      }
    ]);
    
    return res.status(200).json(
      new ApiResponse(
        200,
        await Promise.all(
          findTopicLesson.map(async (i) => {
            let {_id, difficulty, name, image, subject, type, quizes, studentQuizData} = i;
            
            // Match student quiz data with corresponding quizes
            const processedQuizes = quizes.map(quiz => {
              const quizId = quiz._id.toString();
              const matchingStudentQuiz = studentQuizData.find(sq => 
                sq.quizId === quizId
              );
              
              return {
                _id: quiz._id,
                grade: quiz.grade || null,
                image: quiz.image || null,
                status: quiz.status || null,
                studentQuizData: matchingStudentQuiz ? [{
                  marks: matchingStudentQuiz.marks,
                  score: matchingStudentQuiz.score,
                  result: matchingStudentQuiz.result,
                  status: matchingStudentQuiz.status,
                  student: matchingStudentQuiz.student,
                  _id: matchingStudentQuiz._id
                }] : []
              };
            });
            
            return {
              _id,
              difficulty,
              name,
              image,
              subject,
              type,
              quizes: processedQuizes,
              lessons: await Promise.all(
                i.lessons.map(async (j) => {
                  let { name, image, topic, readby } = j;
                  readby = readby?.map(id2 => id2.toString());                  
                  return {
                    name,
                    image,
                    topic,
                    read: readby ? (readby?.includes(id) ? true : false) : false,
                  };
                })
              ),
            };
          })
        ),
        "Subject details successfully"
      )
    );
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
});
// exports.getMyChildbysubjectId = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { subject } = req.query;
//     if (!subject) {
//       return res
//         .status(200)

//         .json({
//           success: false,
//           message: "Missing subject Id",
//         });
//     }
//     const findTopicLesson = await topicModel.aggregate([
//       {
//         $match: {
//           subject: new mongoose.Types.ObjectId(subject),
//         },
//       },
//       {
//         $lookup: {
//           from: "lessons",
//           let: { topicId: { $toString: "$_id" } }, // Convert _id to string
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $eq: [{ $toString: "$topic" }, "$$topicId"], // Convert topic field to string and compare
//                 },
//               },
//             },
//           ],
//           as: "lessons",
//         },
//       },
//       // {
//       //   $match:{
//       //     "lessons.readyby":{$in:[new mongoose.Types.ObjectId(req.user.profile._id)]}
//       //   }
//       // },
//       {
//         $lookup: {
//           from: "quizes",
//           let: { topicId: { $toString: "$_id" } }, // Convert _id to string
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $eq: [{ $toString: "$topic" }, "$$topicId"], // Convert topic field to string and compare
//                 },
//               },
//             },
//           ],
//           as: "quizes",
//         },
//       },
//       {
//         $unwind: {
//           path: "$quizes", // Specify the field you want to unwind
//           preserveNullAndEmptyArrays: true,
//         },
//       },

//       {
//         $lookup: {
//           from: "studentquizes",
//           let: {
//             topicId: { $toString: "$quizes._id" },
//             stdId: { $toString: id },
//           }, // Convert _id to string
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     {
//                       $eq: [{ $toString: "$quiz" }, "$$topicId"], // Convert topic field to string and compare
//                     },
//                     {
//                       $eq: [{ $toString: "$student" }, "$$stdId"], // Convert topic field to string and compare
//                     },
//                   ],
//                 },
//               },
//             },
//           ],
//           as: "studentquizes",
//         },
//       },
//       {
//         $group: {
//           _id: "$_id",
//           name: { $first: "$name" },

//           image: { $first: "$image" },

//           subject: { $first: "$subject" },
//           difficulty: { $first: "$difficulty" },
//           type: { $first: "$type" },
//           lessons: { $first: "$lessons" },

//           // Group by topic ID
//           // subject: { $first: "$subject" }, // Keep other fields from the original topic
//           // name: { $first: "$name" },
//           quizes: {
//             $push: {
//               _id: "$quizes._id", // Keep quiz fields
//               title: "$quizes.createdBy",
//               questions: "$quizes.questions",
//               status: "$quizes.status",
//               grade: "$quizes.grade",
//               topic: "$quizes.topic",
//               subject: "$quizes.subject",
//               image: "$quizes.image",
//               endsAt: "$quizes.endsAt",
//               startsAt: "$quizes.startsAt",
//               studentQuizData: "$studentquizes", // Embed the student quiz data
//             },
//           },
//         },
//       },
//     ]);
//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         await Promise.all(
//           findTopicLesson.map(async (i) => {
//             let {_id, difficulty, name, image, subject, type ,quizes} = i;
//             return {
//               _id,
//               difficulty,
//               name,
//               image,
//               subject,
//               type,              
//               quizes: (i.quizes.length>0&&i.quizes[0]?.studentQuizData?.length>0) ?(await Promise.all(
//                 i.quizes.map(async (q) => {
//                   let { grade, image, status ,_id} = q;
                  
//                   return {
//                     _id,
//                     grade:grade?grade:null,
//                     image:image?image:null,
//                     status:status?status:null,
//                     studentQuizData:q?.studentQuizData?.length>0? await Promise.all(
//                       q.studentQuizData.map(async (qs) => {
//                         let { marks, score, result, status, student ,_id} = qs;
//                         return {marks, score, result, status, student,_id};
//                       })
//                     ):[],
//                   };
//                 })
//               )):[],
//               lessons: await Promise.all(
//                 i.lessons.map(async (j) => {
//                   let { name, image, topic, readby } = j;
//                   readby= readby?.map(id2 => id2.toString());                  
//                   return {
//                     name,
//                     image,
//                     topic,
//                     // readby,
//                     read: readby?(readby?.includes(id) ? true : false): false,
//                   };
//                 })
//               ),
//             };
//           })
//         ),
//         "Subject details  succesfully"
//       )
//     );
//   } catch (error) {
//     res.status(200).json({ message: error.message });
//   }
// });
// exports.getMyChildbysubjectId = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { subject } = req.query;
//     if (!subject) {
//       return res.status(200).json({
//         success: false,
//         message: "Missing subject Id",
//       });
//     }
//     const findTopicLesson = await topicModel.aggregate([
//       {
//         $match: {
//           subject: new mongoose.Types.ObjectId(subject),
//         },
//       },
//       {
//         $lookup: {
//           from: "lessons",
//           let: { topicId: { $toString: "$_id" } },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $eq: [{ $toString: "$topic" }, "$$topicId"],
//                 },
//               },
//             },
//           ],
//           as: "lessons",
//         },
//       },
//       {
//         $lookup: {
//           from: "quizes",
//           let: { topicId: { $toString: "$_id" } },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $eq: [{ $toString: "$topic" }, "$$topicId"],
//                 },
//               },
//             },
//           ],
//           as: "quizes",
//         },
//       },
//       {
//         $unwind: {
//           path: "$quizes",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "studentquizes",
//           let: {
//             quizId: { $toString: "$quizes._id" },
//             studentId: { $toString: id },
//           },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: [{ $toString: "$quiz" }, "$$quizId"] },
//                     { $eq: [{ $toString: "$student" }, "$$studentId"] },
//                   ],
//                 },
//               },
//             },
//           ],
//           as: "studentQuizData",
//         },
//       },
//       {
//         $group: {
//           _id: "$_id",
//           name: { $first: "$name" },
//           image: { $first: "$image" },
//           subject: { $first: "$subject" },
//           difficulty: { $first: "$difficulty" },
//           type: { $first: "$type" },
//           lessons: { $first: "$lessons" },
//           quizes: {
//             $push: {
//               _id: "$quizes._id",
//               title: "$quizes.createdBy",
//               questions: "$quizes.questions",
//               status: "$quizes.status",
//               grade: "$quizes.grade",
//               topic: "$quizes.topic",
//               subject: "$quizes.subject",
//               image: "$quizes.image",
//               endsAt: "$quizes.endsAt",
//               startsAt: "$quizes.startsAt",
//               studentQuizData: "$studentQuizData",
//             },
//           },
//         },
//       },
//     ]);

//     const formattedResults = await Promise.all(
//       findTopicLesson.map(async (topic) => {
//         const processedQuizes = await Promise.all(
//           topic.quizes
//             .filter(q => q._id) // Filter out null quizzes from unwind
//             .map(async (quiz) => ({
//               _id: quiz._id,
//               title: quiz.title,
//               grade: quiz.grade || null,
//               image: quiz.image || null,
//               status: quiz.status || null,
//               studentQuizData: quiz.studentQuizData.map(sq => ({
//                 marks: sq.marks,
//                 score: sq.score,
//                 result: sq.result,
//                 status: sq.status,
//                 student: sq.student,
//                 _id: sq._id,
//               })),
//             }))
//         );

//         const processedLessons = topic.lessons.map(lesson => ({
//           name: lesson.name,
//           image: lesson.image,
//           topic: lesson.topic,
//           read: lesson.readby?.includes(id) || false,
//         }));

//         return {
//           _id: topic._id,
//           difficulty: topic.difficulty,
//           name: topic.name,
//           image: topic.image,
//           subject: topic.subject,
//           type: topic.type,
//           quizes: processedQuizes,
//           lessons: processedLessons,
//         };
//       })
//     );

//     return res.status(200).json(
//       new ApiResponse(200, formattedResults, "Subject details successfully")
//     );
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

exports.myFeedBacks = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const findTeacher = await FeedbackModel.find({
      to: id,
    }).populate({
      path: "from",
      select: "-feedback",
      populate: {
        path: "auth",
        select: ["fullName", "image", "profile", "userName"],
      }, // Exclude the 'password' field
    });

    res
      .status(200)
      .json(new ApiResponse(200, findTeacher, "feedbacks Found Successfully"));
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
});
exports.getQuizInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await StudentquizesModel.find({
      student: id,
      status: "complete",
    }).populate({ path: "quiz", populate: { path: "subject" } });
    return res
      .status(200)
      .json({ success: true, data, message: "Quiz data found Successfully" });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
exports.getnotification = async (req, res) => {
  try {
    const data = await NotificationModel.find({
      $or: [{ for: req.user?.profile?._id }, { forAll: true }],
    })
      .sort({ _id: -1 })
      .limit(10);
    return res
      .status(200)
      .json({ success: true, data, message: "Notification get Successfully" });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
