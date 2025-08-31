const subjectModel = require("../models/subject");
const StudentModel = require("../models/student");
const TeacherModel = require("../models/teacher");
const ApiResponse = require("../utils/ApiResponse");
// const ApiError = require("../utils/Apierror");
const asyncHandler = require("../utils/asyncHandler");
const sendEmail = require("../utils/sendemail");
const FeedbackModel = require("../models/feedback");
const teacherstudentrequestModel = require("../models/teacherstudentrequest");
const teacherModel = require("../models/teacher");
const topicModel = require("../models/topic");
const { default: mongoose } = require("mongoose");
const studentModel = require("../models/student");
const StudentquizesModel = require("../models/studentquizes");
const CallenderEvents = require("../models/CallenderEvents");
const commentModel = require("../models/comment");
const ParentTeacherFeedbackModel = require("../models/parentTeacherFeedback");
const authModel = require("../models/auth");
const parentModel = require("../models/parent");

exports.registerTeacher = asyncHandler(async (req, res) => {
  try {
    const { fullname, username, emailaddress, password, fulladdress } =
      req.body;
    const existUser = await TeacherModel.findOne({
      $or: [{ emailaddress }, { username }],
    });
    if (existUser) {
      throw new Error("User already exists");
    }
    const teacher = new TeacherModel({
      fullname,
      username: username.toLowerCase(),
      emailaddress,
      fulladdress,
      password,
    });
    await teacher.save();
    const emailsubject = "Teacher Registration";
    const email = emailaddress;
    const message = `You are registered successfully as Teacher`;
    const requestType = "Your request for Teacher registration is done";
    await sendEmail(emailsubject, email, message, requestType);
    res
      .status(201)
      .json(new ApiResponse(200, teacher, "teacher created succesfully"));
  } catch (error) {
    const errorMessage = error.message || "Something went wrong";
    res
      .status(error.status || 500)
      .json(new ApiResponse(error.status || 500, errorMessage));
  }
});

exports.teacherAddsubjects = asyncHandler(async (req, res) => {
  const { teacherId } = req.body;
  const subjectId = req.params.id;
  try {
    const findSubject = await subjectModel.findOne({ _id: subjectId });
    if (!findSubject) {
      throw new Error("Subject not found");
    }

    if (findSubject.subjectTeacher) {
      throw new Error("Subject already has a taken by teacher");
    }

    const existTeacher = await TeacherModel.findOne({ _id: teacherId });
    if (!existTeacher) {
      throw new Error("Teacher not found");
    }

    existTeacher.teachersSubjects.push(subjectId);
    findSubject.subjectTeacher = teacherId;

    await existTeacher.save();
    await findSubject.save();

    res
      .status(201)
      .json(new ApiResponse(200, findSubject, "Subject added successfully"));
  } catch (error) {
    const errorMessage = error.message || "Something went wrong";
    return res
      .status(error.status || 500)
      .json(new ApiResponse(error.status || 500, errorMessage));
  }
});

exports.allSubjectsOfteacher = asyncHandler(async (req, res) => {
  const teacherId = req.params.id;

  try {
    const findTeacher = await TeacherModel.findById(teacherId).populate(
      "teachersSubjects"
    );
    const teacherSubjects = findTeacher.teachersSubjects;

    // Initialize an empty array to store subjects and students
    const subjectsWithStudents = [];

    // Iterate over each subject taught by the teacher
    for (const subject of teacherSubjects) {
      // Find students studying the current subject
      const students = await StudentModel.find({
        studentSubjects: subject._id,
      }).select("-password");

      // Push subject and corresponding students to the array
      subjectsWithStudents.push({
        subject: subject,
        students: students,
      });
    }

    res.status(200).json({
      statusCode: 200,
      data: subjectsWithStudents,
      message: "Subjects and students of teacher found successfully",
      success: true,
    });
  } catch (error) {
    res.status(200).json({ message: error.message, success: false });
  }
});

exports.feedBacktoTeacher = asyncHandler(async (req, res) => {
  const teacherId = req.params.id;
  const { feedbackFrom, feedbackText, feedbackBy } = req.body;

  try {
    const newFeedback = {
      feedbackFrom: feedbackFrom,
      feedbackText: feedbackText,
      feedbackBy: feedbackBy,
    };
    const teacher = await TeacherModel.findById({ _id: teacherId });

    if (!teacher) {
      return res.status(200).json({ message: "Teacher not found" });
    }
    teacher.feedback.push(newFeedback);
    await teacher.save();

    res.status(200).json({ message: "Feedback added successfully" });
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
});

exports.myFeedBacks = asyncHandler(async (req, res) => {
  try {
    const findTeacher = await FeedbackModel.find({
      to: req.user.profile._id,
    }).populate({
      path: "from",
      populate: {
        path: "auth",
        select: "-password", // Exclude the 'password' field
      },
    });

    res
      .status(201)
      .json(new ApiResponse(200, findTeacher, "feedbacks Found Successfully"));
  } catch (error) {
    res.status(200).json({ message: error.message || "Something went wrong" });
  }
});

exports.mystudents = async (req, res) => {
  try {

    let data = await teacherModel
      .findOne(
        {
          _id: req.user?.profile?._id,
        },
        { students: 1 }
      )
      .populate({
        path: "students",
        select: "auth",
        populate: {
          path: "auth",

          select: ["userName", "fullName", "email", "image", "fullAddress"],
        },
      })
      .populate({
        path: "students",
        select: ["auth", "code"],
        populate: [
          {
            path: "grade",
            select: ["grade"]
          },
          {
            path: "subjects",
            select: ["image", "name"]
          },
          {
            path: "parent",
            select: ["_id"],
            populate: {
              path: "auth",
              select: ["fullName"]
            },
            model: "Parent"
          }
        ],
      });

    if (data?.students?.length > 0) {
      let val = [];
      data?.students.map(async (i, index) => {

        let q = await StudentquizesModel.find({ student: i?._id });

        val.push({
          ...i._doc, quiz: {
            total: q.length,
            pass: q.filter((i) => {
              return i.result == "pass";
            }).length
          }
        });

        if (index == data?.students.length - 1) {
          setTimeout(() => {
            return res
              .status(200)
              .json({
                success: true,
                data: val,
                message: "get Student successfully",
              });
          }, 100)
        }
      });
    } else {
      return res
        .status(200)
        .json({ success: true, data: [], message: "You have no any student" });
    }
  } catch (error) {
    res.status(200).json({ message: error.message || "Something went wrong" });
  }
};

exports.addstudent = async (req, res) => {
  try {
    const { stdId, grade } = req.body;
    if (!stdId || !grade) {
      return res
        .status(200)
        .json({ success: false, message: "StdId and grade are required" });
    }

    // Check subscription limits for parents
    if (req.user.userType === 'Parent') {
      try {
        // Get user's subscription status
        const user = await authModel.findById(req.user._id);
        if (!user.isSubscribed) {
          return res.status(200).json({
            success: false,
            message: "Subscription required to add students"
          });
        }

        // Get current children count
        const currentChildren = await parentModel.findOne({ auth: req.user._id });
        const currentCount = currentChildren?.childIds?.length || 0;

        // Determine student limit based on subscription plan
        let maxStudents = 1; // Default to 1 student

        if (user.plan === 'allowToRegisterMultiStudents') {
          maxStudents = 999; // Unlimited
        } else {
          // Check if we can determine from subscription metadata
          // This would need to be implemented based on your subscription system
          // For now, using the plan field
        }

        if (currentCount + stdId.length > maxStudents) {
          return res.status(200).json({
            success: false,
            message: `You can only add up to ${maxStudents} student${maxStudents !== 1 ? 's' : ''}. Current: ${currentCount}, Requested: ${stdId.length}`
          });
        }
      } catch (subscriptionError) {
        console.error('Error checking subscription:', subscriptionError);
        return res.status(200).json({
          success: false,
          message: "Error checking subscription status"
        });
      }
    }

    // Check subscription limits for teachers
    if (req.user.userType === 'Teacher') {
      try {
        const user = await authModel.findById(req.user._id);
        if (!user.isSubscribed) {
          return res.status(200).json({
            success: false,
            message: "Subscription required to add students"
          });
        }
      } catch (subscriptionError) {
        console.error('Error checking subscription:', subscriptionError);
        return res.status(200).json({
          success: false,
          message: "Error checking subscription status"
        });
      }
    }

    stdId.map(async (i, index) => {
      let std = await StudentModel.findOne({ code: i });
      if (!std) {
        return res
          .status(200)
          .json({ success: false, message: "Invalid Student Id" });
      } else {
        let alreadyregisted = await teacherstudentrequestModel.findOne({
          teacher: req.user.profile._id,
          student: std._id,
        });
        if (alreadyregisted) {
          if (
            alreadyregisted.status == "Pending" ||
            alreadyregisted.status == "Rejected"
          ) {
            return res
              .status(200)
              .json({
                success: false,
                message: "Already applied for addition",
              });
          } else {
            return res
              .status(200)
              .json({ success: false, message: "Already a student" });
          }
        }
        let str = await new teacherstudentrequestModel({
          teacher: req.user.profile._id,
          student: std._id,
          grade: grade
        }).save();
      }
      if (index == stdId.length - 1) {
        return res
          .status(200)
          .json({ success: true, message: "Request added successfully" });
      }
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
exports.mydashboard = async (req, res) => {
  try {
    let data = await teacherModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user?.profile?._id),
        },
      },
      {
        $lookup: {
          from: "quizes",
          let: { teacherId: { $toString: "$_id" } }, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$createdBy" }, "$$teacherId"], // Convert topic field to string and compare
                },
              },
            },
          ],
          as: "quizes",
        },
      },
      {
        $lookup: {
          from: "games",
          let: { teacherId: { $toString: "$_id" } }, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$createdBy" }, "$$teacherId"], // Convert topic field to string and compare
                },
              },
            },
          ],
          as: "games",
        },
      },
    ]);
    // let data = await teacherModel.findOne({
    //   _id: req.user?.profile?._id

    // })

    res.status(200).json({
      success: true,
      message: "Data get successfully",
      data: {
        students: data[0]?.students?.length,
        subject: data[0]?.subjects?.length,
        quizes: data[0]?.quizes?.length,
        games: data[0]?.games?.length,
      },
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
exports.mycourses = async (req, res) => {
  try {
    const mycourses = await subjectModel.find({
      _id: { $in: req.user?.profile?.subjects },
    });
    const newcourses = await subjectModel
      .find({
        _id: { $nin: req.user?.profile?.subjects },
        grade: req.user?.profile?.grade?._id,
      })
      .sort({ _id: -1 });
    res.status(200).json({
      success: true,
      message: "Data get successfully",
      data: {
        mycourses,
        newcourses,
      },
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

exports.addfeedback = asyncHandler(async (req, res) => {
  try {
    const { student, feedback, star, grade } = req.body;
    const existStudent = await studentModel.findOne({ _id: student });
    // const existfeedback = await FeedbackModel.findOne({
    //   student,
    //   teacher: req.user.profile._id,
    //   grade,
    // });

    if (!existStudent) {
      throw new Error("Invalid student id");
    }
    // if (existfeedback) {
    //   throw new Error("already added feedback");
    // }
    if (star > 5) {
      throw new Error("value of star must be equal to or less than 5");
    }
    // if(!existStudent.teacher.includes(req.user.profile._id)){
    //   throw new Error("You can't add feedback for this teacher");

    // }
    const feedbackdata = await FeedbackModel.findOneAndUpdate(
      {
        fromType: "Teacher",
        to: student,
        toType: "Student",
        from: req.user.profile._id,
      },
      {
        $set: {
          fromType: "Teacher",
          to: student,
          toType: "Student",
          from: req.user.profile._id,
          grade,
          feedback,
          star: parseInt(star),
        },
      },
      { upsert: true, new: true }
    );
    return res.send({
      success: true,
      data: feedbackdata,
      message: "Feedback done successfully",
    });
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
});
exports.mysubjects = async (req, res) => {
  try {
    let data = await teacherModel
      .findOne({ _id: req.user?.profile?._id })
      .populate({ path: "subjects", select: ["name", "image"] });
    return res.send({
      success: true,
      data: data.subjects,
      message: "subjects get Successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
};

exports.getCalendarEvents = async (req, res) => {
  try {
    const events = await CallenderEvents.find();
    return res.status(200).json({
      success: true,
      data: events,
      message: "Calendar events retrieved successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
};

exports.addCalendarEvent = async (req, res) => {
  try {
    const { title, startDate, endDate } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(200).json({
        success: false,
        message: "All fields are required"
      });
    }

    const event = new CallenderEvents({
      title,
      startDate,
      endDate,
      createdBy: req.user._id,
      userType: req.user.userType
    });

    await event.save();
    return res.status(200).json({
      success: true,
      data: event,
      message: "Calendar event created successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
}

// Add a new comment
exports.addComment = asyncHandler(async (req, res) => {
  try {
    const { text, subject, recipientId } = req.body;

    if (!text || !subject || !recipientId) {
      return res.status(200).json({
        success: false,
        message: "Text, subject, and recipient are required"
      });
    }

    // Determine recipient type based on current user type
    const recipientType = req.user.userType === "Teacher" ? "Student" : "Teacher";

    const comment = new commentModel({
      text,
      subject,
      user: req.user._id,
      userType: req.user.userType,
      recipient: recipientId,
      recipientType
    });

    await comment.save();

    return res.status(200).json({
      success: true,
      data: comment,
      message: "Comment added successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Get comments between users
exports.getComments = asyncHandler(async (req, res) => {
  try {
    const { recipientId } = req.params;

    // Find all comments where:
    // Either the current user is the sender and recipientId is the recipient
    // OR the current user is the recipient and recipientId is the sender
    const comments = await commentModel.find({
      $or: [
        { user: req.user._id, recipient: recipientId },
        { user: recipientId, recipient: req.user._id }
      ]
    })
      .sort({ createdAt: 1 }) // Sort by creation time, oldest first
      .populate('user', 'fullName userName image')
      .populate('recipient', 'fullName userName image')
      .populate('subject', 'name image'); // Populate subject information

    return res.status(200).json({
      success: true,
      data: comments,
      message: "Comments retrieved successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Add feedback to parent
exports.addParentFeedback = asyncHandler(async (req, res) => {
  try {
    const { parentId, studentId, comment, stars } = req.body;

    if (!parentId || !studentId || !comment || !stars) {
      return res.status(200).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (stars < 1 || stars > 5) {
      return res.status(200).json({
        success: false,
        message: "Stars must be between 1 and 5"
      });
    }

    // Use findOneAndUpdate with upsert to ensure only one feedback exists
    const feedback = await ParentTeacherFeedbackModel.findOneAndUpdate(
      {
        teacherId: req.user.profile._id,
        parentId,
        studentId
      },
      {
        comment,
        stars
      },
      {
        new: true,
        upsert: true // This will create if doesn't exist, update if it does
      }
    );

    return res.status(200).json({
      success: true,
      data: feedback,
      message: "Feedback saved successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Get feedback for a specific student and parent
exports.getParentFeedback = asyncHandler(async (req, res) => {
  try {
    const { studentId, parentId } = req.params;

    const feedback = await ParentTeacherFeedbackModel.findOne({
      studentId,
      parentId,
      teacherId: req.user.profile._id
    })
      .populate('teacherId', 'auth')
      .populate({
        path: 'teacherId',
        populate: {
          path: 'auth',
          select: 'fullName userName image'
        }
      });

    return res.status(200).json({
      success: true,
      data: feedback || null,
      message: feedback ? "Feedback retrieved successfully" : "No feedback found"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

// Get all feedbacks for a parent-student combination
exports.getAllParentFeedbacks = asyncHandler(async (req, res) => {
  try {
    const { studentId, parentId } = req.params;

    const feedbacks = await ParentTeacherFeedbackModel.find({
      studentId,
      parentId
    })
      .populate({
        path: 'teacherId',
        populate: {
          path: 'auth',
          select: 'fullName userName image'
        }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: feedbacks,
      message: feedbacks.length > 0 ? "Feedbacks retrieved successfully" : "No feedbacks found"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});