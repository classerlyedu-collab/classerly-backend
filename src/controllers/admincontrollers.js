const EventModel = require("../models/Events");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const TeacherModel = require("../models/teacher");
const StudentModel = require("../models/student");
const ParentModel = require("../models/parent");
const AuthModel = require("../models/auth");
const QuizesModel = require("../models/quizes");
const SubjectsModel = require("../models/subject");
const StudentquizesModel = require("../models/studentquizes");
const TopicModel = require("../models/topic");
const LessonModel = require("../models/LessonsModel");
const CouponModel = require("../models/coupon");
const moment = require("moment");
const { tokengenerate } = require("../middlewares/auth");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.AdminAddEvent = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const event = name.toLowerCase();

  try {
    const findEvent = await EventModel.findOne({ name: event });
    if (findEvent) {
      throw new Error("Event Already exist");
    }
    const upcomingEvent = await EventModel.create({
      name: event,
    });
    await upcomingEvent.save();
    res.status(200).json({
      success: true,
      data: upcomingEvent,
      message: "Event Created Successfuly",
    });
  } catch (error) {
    const errorMessage = error.message || "Something went wrong";
    return res
      .status(error.status || 500)
      .json(new ApiResponse(error.status || 500, errorMessage));
  }
});

// Get all teachers
exports.getAllTeachers = asyncHandler(async (req, res) => {
  try {
    const teachers = await TeacherModel.find()
      .select("-password")
      .populate("auth", "-password");
    res.status(200).json(new ApiResponse(200, teachers, "Teachers retrieved successfully"));
  } catch (error) {
    res.status(500).json(new ApiResponse(500, null, error.message || "Unable to retrieve teachers"));
  }
});

// Get a teacher by ID
exports.getTeacherById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const teacher = await TeacherModel.findById(id)
      .select("-password")
      .populate("auth", "-password") // Populate auth details, excluding password
      .populate({
        path: "students",
        populate: {
          path: "auth", // Populate each student's auth data
          select: "-password" // Exclude the password field
        }
      })
      .populate("subjects") // Populate subjects' details
      .populate("grade"); // Populate grade details

    if (!teacher) {
      return res.status(404).json(new ApiResponse(404, null, "Teacher not found"));
    }

    res.status(200).json(new ApiResponse(200, teacher, "Teacher retrieved successfully"));
  } catch (error) {
    res.status(500).json(new ApiResponse(500, null, error.message || "Unable to retrieve teacher"));
  }
});

// Get all students
exports.getAllStudents = asyncHandler(async (req, res) => {
  try {
    const students = await StudentModel.find()
      .populate("auth", "-password") // Populate auth details, excluding password
      .populate("subjects") // Populate subjects if you want details
      .populate("grade");

    res.status(200).json(new ApiResponse(200, students, "Students retrieved successfully"));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get a student by ID
exports.getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const student = await StudentModel.findById(id)
      .populate("auth", "-password") // Populate auth details for the student
      .populate({
        path: "grade",
        populate: {
          path: "teachers",
          select: "-password", // Exclude password field for teachers
          populate: { path: "auth", select: "-password" }, // Populate auth for teachers
        },
      })
      // .populate({
      //   path: "parent",
      //   select: "-password",
      //   populate: { path: "auth", select: "-password" }, // Populate auth for the parent
      // })
      .populate({
        path: "subjects",
        populate: {
          path: "teachers",
          select: "-password", // Exclude password field for teachers
          populate: { path: "auth", select: "-password" }, // Populate auth for teachers
        },
      });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found!" });
    }

    res.status(200).json(new ApiResponse(200, student, "Student retrieved successfully"));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Helper to get an array of the last 12 months
function getLastTwelveMonths() {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = moment().subtract(i, 'months');
    months.push({
      year: date.year(),
      month: date.month() + 1, // month() is zero-based, so add 1 
      label: date.format("MMMM"),
      count: 0 // Default count as 0
    });
  }
  return months.reverse(); // Reverse to get chronological order
}

// Get monthly registration counts for the last 12 months
exports.getMonthlyStudentRegistrations = asyncHandler(async (req, res) => {
  try {
    const twelveMonthsAgo = moment().subtract(12, "months").startOf("month").toDate();

    const monthlyRegistrations = await StudentModel.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
        },
      },
    ]);

    // Populate counts in the last 12 months
    const lastTwelveMonths = getLastTwelveMonths();
    lastTwelveMonths.forEach(monthData => {
      const match = monthlyRegistrations.find(
        reg => reg.month === monthData.month && reg.year === monthData.year
      );
      if (match) {
        monthData.count = match.count;
      }
    });

    res.status(200).json(new ApiResponse(200, lastTwelveMonths, "Monthly registration counts retrieved successfully"));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get all parents
exports.getAllParents = asyncHandler(async (req, res) => {
  try {
    const parents = await ParentModel.find()
      .populate("auth", "-password") // Populate auth details, excluding password
      .populate("childIds") // Populate childIds to get student details
      .populate("grade"); // Populate grade if needed

    res.status(200).json(new ApiResponse(200, parents, "Parents retrieved successfully"));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get a parent by ID
exports.getParentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const parent = await ParentModel.findById(id)
      .populate("auth", "-password") // Populate parent's auth details, excluding password
      .populate({
        path: "childIds",
        populate: [
          { path: "auth", select: "-password" }, // Populate each child's auth details, excluding password
          { path: "grade" }, // Populate each child's grade details if needed
        ],
      });

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found!" });
    }

    res.status(200).json(new ApiResponse(200, parent, "Parent retrieved successfully"));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// update user
exports.updateUserByAdmin = asyncHandler(async (req, res) => {
  try {
    const { id, userId, userName, image, grade, subjects, emailNotification, notification, isSubscribed, couponCode } = req.body;

    // Function to clean up the object, removing any fields with invalid values
    const cleanObject = (obj) => {
      return Object.fromEntries(
        Object.entries(obj).filter(
          ([key, value]) =>
            value !== null &&
            value !== "null" &&
            value !== "" &&
            value !== undefined &&
            value !== "undefined"
        )
      );
    };

    // Use userId if provided, otherwise use id
    const targetUserId = userId || id;

    // Update authentication details if provided
    if (userName || image || emailNotification != null || notification != null || isSubscribed != null || couponCode != null) {
      const updateData = cleanObject({
        userName,
        image,
        emailNotification,
        notification,
        isSubscribed,
        couponUsed: couponCode ? true : undefined,
        couponProvider: couponCode ? req.user._id : undefined
      });

      await AuthModel.findByIdAndUpdate(
        { _id: targetUserId },
        updateData,
        { new: true }
      );

      // If granting subscription access and coupon code is provided, create/update coupon
      if (isSubscribed && couponCode) {
        try {
          // Check if coupon already exists
          let coupon = await CouponModel.findOne({ code: couponCode.toUpperCase() });

          if (!coupon) {
            // Create new coupon
            coupon = new CouponModel({
              code: couponCode.toUpperCase(),
              description: `Free access granted by admin to ${targetUserId}`,
              type: "FREE_ACCESS",
              discountPercentage: 100,
              maxUses: 1,
              createdBy: req.user._id,
              validFrom: new Date(),
              validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            });
          }

          // Add user to coupon usage
          if (!coupon.usedBy.some(usage => usage.user.toString() === targetUserId)) {
            coupon.usedBy.push({ user: targetUserId });
            coupon.usedCount = coupon.usedBy.length;
          }

          await coupon.save();
        } catch (couponError) {
          console.error('Error creating/updating coupon:', couponError);
          // Don't fail the main operation if coupon creation fails
        }
      }
    }

    // Update additional user-related information based on user type
    if (grade) {
      // Assuming you have a way to determine the user type
      const userType = (await AuthModel.findById(targetUserId)).userType; // Retrieve user type based on ID

      switch (userType) {
        case "Student": {
          await StudentModel.findOneAndUpdate(
            {
              auth: targetUserId,
            },
            {
              grade,
              subjects
            },
            { new: true }
          );
          break; // Added break to prevent fall-through
        }
        case "Parent": {
          await ParentModel.findOneAndUpdate(
            {
              auth: targetUserId,
            },
            {
              grade,
            },
            { new: true }
          );
          break; // Added break to prevent fall-through
        }
        case "Teacher": {
          await TeacherModel.findOneAndUpdate(
            {
              auth: targetUserId,
            },
            {
              $addToSet: { grade: grade, subjects: subjects } // Using $addToSet to avoid duplicates
            },
            { new: true }
          );
          break; // Added break to prevent fall-through
        }
        default: {
          // Handle cases where user type is unrecognized
          return res.status(400).json({ success: false, message: "Invalid user type" });
        }
      }
    }

    // Fetch updated user data to return in response
    let data = await AuthModel.findOne({ _id: targetUserId }).populate({
      path: "profile",
      populate: {
        path: "grade",
      },
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        data,
        token: tokengenerate(data), // Generate new token if necessary
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// block user by id
exports.blockUserById = asyncHandler(async (req, res) => {
  const { id } = req.body; // Get the user ID from the URL parameters
  try {
    // Update the user's isBlocked status to true
    const updatedUser = await AuthModel.findByIdAndUpdate(
      id,
      { isBlocked: true },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: updatedUser,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// unblock user by id
exports.unblockUserById = asyncHandler(async (req, res) => {
  const { id } = req.body; // Get the user ID from the URL parameters
  try {
    // Update the user's isBlocked status to true
    const updatedUser = await AuthModel.findByIdAndUpdate(
      id,
      { isBlocked: false }, // Assuming you have an `isBlocked` field
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: updatedUser,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// Get all quizzes
exports.getAllQuizzess = asyncHandler(async (req, res) => {
  try {
    const quizzes = await QuizesModel.find()
      .populate('createdBy') // Optionally populate the creator's information
      .populate('questions') // Optionally populate the questions
      .populate('grade') // Optionally populate the grade
      .populate('topic') // Optionally populate the topic
      .populate('lesson') // Optionally populate the lesson
      .populate('subject'); // Optionally populate the subject

    return res.status(200).json({
      success: true,
      message: "Quizzes retrieved successfully",
      data: quizzes,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get quiz by Id
exports.getQuizById = asyncHandler(async (req, res) => {
  try {

    const { id } = req.params;

    const quizzes = await QuizesModel.findById(id)
      .populate('createdBy') // Optionally populate the creator's information
      .populate('questions') // Optionally populate the questions
      .populate('grade') // Optionally populate the grade
      .populate('topic') // Optionally populate the topic
      .populate('lesson') // Optionally populate the lesson
      .populate('subject'); // Optionally populate the subject

    return res.status(200).json({
      success: true,
      message: "Quizzes retrieved successfully",
      data: quizzes,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get all subjects
exports.getAllSubjects = asyncHandler(async (req, res) => {
  try {
    const subjects = await SubjectsModel.find()
      .populate('topics') // Optionally populate the topics
      .populate('teachers') // Optionally populate the teachers
      .populate('grade'); // Optionally populate the grade

    return res.status(200).json({
      success: true,
      message: "Subjects retrieved successfully",
      data: subjects,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Edit a subject (name or image)
exports.editSubject = asyncHandler(async (req, res) => {
  const { id, name, image } = req.body; // New name or image from the request body    

  try {
    // Find the subject by ID and update the fields (name or image)
    const updatedSubject = await SubjectsModel.findByIdAndUpdate(
      id,
      {
        $set: {
          name: name || undefined, // Only update name if provided
          image: image || undefined, // Only update image if provided
        },
      },
      { new: true } // Return the updated subject object
    );

    if (!updatedSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: updatedSubject,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a subject by ID
exports.deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params; // Get subject ID from URL params

  try {
    // Find the subject by ID and delete it
    const deletedSubject = await SubjectsModel.findByIdAndDelete(id);

    if (!deletedSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
      data: deletedSubject,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get all topics by subjects id
exports.getTopicsBySubjectId = asyncHandler(async (req, res) => {

  const { id } = req.params; // Get the subject ID from the request parameters

  try {
    const topics = await TopicModel.find({ subject: id });

    return res.status(200).json({
      success: true,
      message: "Topics retrieved successfully",
      data: topics,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Edit a topic (name, difficulty, type)
exports.editTopic = asyncHandler(async (req, res) => {
  const { topicId, name, difficulty, type } = req.body; // New values for name, difficulty, or type

  try {
    // Find the topic by ID and update the fields (name, difficulty, type)
    const updatedTopic = await TopicModel.findByIdAndUpdate(
      topicId,
      {
        $set: {
          name: name || undefined, // Only update name if provided
          difficulty: difficulty || undefined, // Only update difficulty if provided
          type: type || undefined, // Only update type if provided
        },
      },
      { new: true } // Return the updated topic object
    );

    if (!updatedTopic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Topic updated successfully",
      data: updatedTopic,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a topic by ID
exports.deleteTopic = asyncHandler(async (req, res) => {
  const { topicId } = req.body; // Topic ID passed as parameter
  console.log('topic id', topicId);

  try {
    // Find the topic by ID and delete it
    const deletedTopic = await TopicModel.findByIdAndDelete(topicId);

    if (!deletedTopic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Topic deleted successfully",
      data: deletedTopic,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get all lessons by topic id
exports.getLessonsByTopicId = asyncHandler(async (req, res) => {

  const { id } = req.params; // Get the subject ID from the request parameters

  try {
    const lessons = await LessonModel.find({ topic: id });

    return res.status(200).json({
      success: true,
      message: "Lessons retrieved successfully",
      data: lessons,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Edit a lesson (name, content, pages, lang)
exports.editLesson = asyncHandler(async (req, res) => {
  const { lessonId, name, content, pages, lang } = req.body; // New values for name, content, pages, lang
  console.log(lessonId, name, content, pages, lang);


  try {
    // Find the lesson by ID and update the fields (name, content, pages, lang)
    const updatedLesson = await LessonModel.findByIdAndUpdate(
      lessonId,
      {
        $set: {
          name: name || undefined, // Only update name if provided
          content: content || undefined, // Only update content if provided
          pages: pages || undefined, // Only update pages if provided
          lang: lang || undefined, // Only update language if provided
        },
      },
      { new: true } // Return the updated lesson object
    );

    if (!updatedLesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      data: updatedLesson,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a lesson by ID
exports.deleteLesson = asyncHandler(async (req, res) => {
  const { lessonId } = req.body; // Lesson ID passed as parameter

  console.log('lesson id', lessonId);


  try {
    // Find the lesson by ID and delete it
    const deletedLesson = await LessonModel.findByIdAndDelete(lessonId);

    if (!deletedLesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
      data: deletedLesson,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get a lesson by lesson id
exports.getLessonById = asyncHandler(async (req, res) => {
  const { id } = req.params; // Get the lesson ID from the request parameters

  try {
    const lesson = await LessonModel.findById(id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lesson retrieved successfully",
      data: lesson,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// get Analytics
exports.getAnalyticsForAdmin = asyncHandler(async (req, res) => {
  try {
    // Count teachers, students, parents
    const teacherCount = await AuthModel.countDocuments({ userType: 'Teacher' });
    const studentCount = await AuthModel.countDocuments({ userType: 'Student' });
    const parentCount = await AuthModel.countDocuments({ userType: 'Parent' }); // Assuming you have a userType for parents

    // Count subjects
    const subjectCount = await SubjectsModel.countDocuments();

    // Count subjects
    const topicsCount = await TopicModel.countDocuments();

    // Count lessons
    const lessonsCount = await LessonModel.countDocuments();

    // Count quizzes
    const quizCount = await QuizesModel.countDocuments();

    return res.status(200).json({
      success: true,
      data: {
        totalTeachers: teacherCount,
        totalStudents: studentCount,
        totalParents: parentCount,
        totalSubjects: subjectCount,
        totalQuizzes: quizCount,
        totalTopics: topicsCount,
        totalLessons: lessonsCount
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get quiz pass/fail averages
exports.getQuizPassFailAverages = asyncHandler(async (req, res) => {
  try {
    const { subjectId } = req.params;

    // First, get all quizzes for the specified subject
    const subjectQuizzes = await QuizesModel.find({ subject: subjectId });

    if (!subjectQuizzes.length) {
      return res.status(200).json({
        success: true,
        data: {
          totalQuizzes: 0,
          passCount: 0,
          failCount: 0,
          passPercentage: 0,
          failPercentage: 0,
          averageScore: 0
        }
      });
    }

    // Get all student quizzes for these quizzes
    const quizIds = subjectQuizzes.map(quiz => quiz._id);
    const studentQuizzes = await StudentquizesModel.find({
      quiz: { $in: quizIds },
      result: { $in: ["pass", "fail"] } // Only count completed quizzes
    });

    // Calculate statistics
    const totalQuizzes = studentQuizzes.length;
    const passCount = studentQuizzes.filter(quiz => quiz.result === "pass").length;
    const failCount = studentQuizzes.filter(quiz => quiz.result === "fail").length;
    const totalScore = studentQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0);

    // Calculate percentages and average
    const passPercentage = totalQuizzes > 0 ? (passCount / totalQuizzes) * 100 : 0;
    const failPercentage = totalQuizzes > 0 ? (failCount / totalQuizzes) * 100 : 0;
    const averageScore = totalQuizzes > 0 ? totalScore / totalQuizzes : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalQuizzes,
        passCount,
        failCount,
        passPercentage: passPercentage.toFixed(2),
        failPercentage: failPercentage.toFixed(2),
        averageScore: averageScore.toFixed(2)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

exports.getActiveUsers = asyncHandler(async (req, res) => {
  console.log("get hit")
  try {
    // Fetch all subscribed users who are either Students, Teachers, or Parents
    const activeUsers = await AuthModel.aggregate([
      {
        $match: {
          isSubscribed: true,
          userType: { $in: ["Student", "Teacher", "Parent"] }
        }
      },
      {
        $group: {
          _id: "$userType",
          total: { $sum: 1 },
          users: { $push: { _id: "$_id", fullName: "$fullName", email: "$email" } }
        }
      }
    ]);

    // Formatting response
    const response = {
      totalActiveStudents: 0,
      totalActiveTeachers: 0,
      totalActiveParents: 0,
      users: {}
    };

    activeUsers.forEach((group) => {
      if (group._id === "Student") response.totalActiveStudents = group.total;
      if (group._id === "Teacher") response.totalActiveTeachers = group.total;
      if (group._id === "Parent") response.totalActiveParents = group.total;
      response.users[group._id] = group.users;
    });

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

exports.getAllCustomerSubscriptions = asyncHandler(async (req, res) => {
  try {
    const { limit = 10, starting_after } = req.query;

    // 🗓️ Get timestamps for filtering
    const startOfMonth = Math.floor(new Date(new Date().setDate(1)).getTime() / 1000);
    const startOfYear = Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000);

    // 🔥 Fetch Monthly Revenue & Subscribers
    const monthlyInvoices = await stripe.invoices.list({
      created: { gte: startOfMonth },
      status: "paid",
      limit: 100,
    });
    const totalMonthlyRevenue = monthlyInvoices.data.reduce((sum, invoice) => sum + invoice.amount_paid, 0) / 100;

    const monthlySubscribers = await stripe.subscriptions.list({
      created: { gte: startOfMonth },
      status: "active",
      limit: 100,
      expand: ["data.latest_invoice", "data.items.data.price", "data.customer"]
    });

    // 🔥 Fetch Yearly Revenue & Subscribers
    const yearlyInvoices = await stripe.invoices.list({
      created: { gte: startOfYear },
      status: "paid",
      limit: 100,
    });
    const totalYearlyRevenue = yearlyInvoices.data.reduce((sum, invoice) => sum + invoice.amount_paid, 0) / 100;

    const yearlySubscribers = await stripe.subscriptions.list({
      created: { gte: startOfYear },
      status: "active",
      limit: 100,
      expand: ["data.latest_invoice", "data.items.data.price", "data.customer"]
    });

    // 🎯 Fetch Paginated Subscriber List
    const subscriberParams = { limit: parseInt(limit, 10) };
    if (starting_after) subscriberParams.starting_after = starting_after;
    const paginatedSubscribers = await stripe.subscriptions.list({ ...subscriberParams, expand: ["data.latest_invoice", "data.items.data.price", "data.customer"] });

    // 🏁 Return Response
    return res.json({
      total_monthly_revenue: totalMonthlyRevenue.toFixed(2),
      total_yearly_revenue: totalYearlyRevenue.toFixed(2),
      total_monthly_subscribers: monthlySubscribers.data.length,
      total_yearly_subscribers: yearlySubscribers.data.length,
      paginated_subscribers: await Promise.all(paginatedSubscribers.data.map(async (sub) => {
        const price = sub.items.data[0]?.price;
        const currency = price?.currency.toUpperCase();
        const priceAmount = price?.unit_amount / 100;
        const invoicePdf = sub.latest_invoice?.invoice_pdf || null;

        // Ensure customer ID is a string before retrieving
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const customer = await stripe.customers.retrieve(customerId);
        const customerEmail = customer?.email || "No Email Available";

        let planName = "Unknown Plan";
        if (price?.product) {
          const product = await stripe.products.retrieve(price.product);
          planName = product.name;
        }

        return {
          customer_id: customerId,
          customer_email: customerEmail,
          subscription_id: sub.id,
          plan_name: planName,
          status: sub.status,
          start_date: new Date(sub.start_date * 1000),
          current_period_end: new Date(sub.current_period_end * 1000),
          amount: priceAmount ? `${priceAmount} ${currency}` : "No Price Available",
          invoice_pdf: invoicePdf
        };
      })),
      has_more_subscribers: paginatedSubscribers.has_more,
      next_starting_after: paginatedSubscribers.has_more
        ? paginatedSubscribers.data[paginatedSubscribers.data.length - 1].id
        : null,
    });
  } catch (error) {
    console.error("Error fetching subscription summary:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all admin-created coupons
exports.getAllCoupons = asyncHandler(async (req, res) => {
  try {
    const coupons = await CouponModel.find({})
      .populate('createdBy', 'fullName email')
      .populate('usedBy.user', 'fullName email userType')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: coupons,
      message: "Coupons retrieved successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

