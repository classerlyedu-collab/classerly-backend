const FeedbackModel = require("../models/feedback");
const studentModel = require("../models/student");
const StudentgamesModel = require("../models/studentgames.model");
const StudentquizesModel = require("../models/studentquizes");
const teacherModel = require("../models/teacher");
const teacherstudentrequestModel = require("../models/teacherstudentrequest");
const asyncHandler = require("../utils/asyncHandler");
exports.mysubjects = async (req, res) => {
  try {
    let data = await studentModel
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

// exports.myteachers = async (req, res) => {
//   try {
//     let data = await teacherModel.find(
//       { students: { $in: [req.user?.profile?._id] } },
//       { auth: 1 ,feedback:0,grade:0,students:0,subjects:0}
//     );

//     return res.send({
//       success: true,
//       data,
//       message: "teachersget Successfully",
//     });
//   } catch (error) {
//     return res.status(200).json({ success: false, message: error.message });
//   }
// };
exports.getmyrequests = async (req, res) => {
  try {
    let data = await teacherstudentrequestModel
      .find({
        student: req.user?.profile?._id,
        status: "Pending",
      })
      .populate({
        path: "teacher",
        select: "auth",
        populate: {
          path: "auth",
          select: ["userName", "fullName", "email", "image", "fullAddress"],
        },
      });
    return res.send({
      success: true,
      data,
      message: "requests get Successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
};

exports.updaterequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status != "Completed" && status != "Rejected") {
      return res.send({
        success: false,
        message: "Invalid Status",
      });
    }
    const data = await teacherstudentrequestModel.findById(id);
    if (!data) {
      return res.send({
        success: false,
        message: "Invalid Request",
      });
    }
    await teacherstudentrequestModel.findOneAndUpdate({ _id: id }, { status });
    if (status == "Completed") {
      await teacherModel.findOneAndUpdate(
        { _id: data.teacher },
        { $addToSet: { students: req.user?.profile?._id } }
      );
      
      await studentModel.findOneAndUpdate(
        { _id: req.user?.profile?._id },
        { grade: data.grade }
      );
    }

    return res.send({
      success: true,
      message: "Request updated successfully",
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
};
exports.addfeedback = asyncHandler(async (req, res) => {
  try {
    const { teacher, feedback, star, grade } = req.body;
    const existTeacher = await teacherModel.findOne({ _id: teacher });
    // const existfeedback = await FeedbackModel.findOne({
    //   teacher,
    //   parent: req.user.profile._id,
    //   grade,
    // });

    if (!existTeacher) {
      throw new Error("Invalid teacher id");
    }
    // if (existfeedback) {
    //   throw new Error("already added feedback");
    // }
    if (star > 5) {
      throw new Error("value of star must be equal to or less than 5");
    }
    if (!existTeacher.students.includes(req.user.profile._id)) {
      throw new Error("You can't add feedback for this teacher");
    }

    const feedbackdata = await FeedbackModel.findOneAndUpdate(
      {
        fromType: "Student",
        from: req.user.profile._id,
        toType: "Teacher",
        to: teacher,
      },
      {
        $set: {
          fromType: "Student",
          from: req.user.profile._id,
          toType: "Teacher",
          to: teacher,
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
exports.updatefeedback = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, star } = req.body;

    const existfeedback = await FeedbackModel.findOne({
      _id: id,
      from: req.user.profile._id,
    });

    if (!existfeedback) {
      throw new Error("Invalid id");
    }
    if (star && star > 5) {
      throw new Error("value of star must be equal to or less than 5");
    }
    const feedbackdata = await FeedbackModel.findOneAndUpdate(
      {
        _id: id,
        from: req.user.profile._id,
      },
      {
        feedback,
        star: parseInt(star),
      },
      { new: true }
    );
    return res.send({
      success: true,
      data: feedbackdata,
      message: "Feedback update successfully",
    });
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
});

exports.getmyteacher = async (req, res) => {
  try {
    let data = await teacherModel
      .find({
        students: { $in: req.user.profile._id },
      },{auth:1})
      .populate({path:"auth", select:"-password"});
    return res.send({
      success: true,
      data,
      message: "Teachers get successfully",
    });
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
};
exports.myresult = async (req, res) => {
  try {
    let data = await StudentquizesModel.find({
      student: req.user?.profile?._id,
    });
    // let data1 =await StudentgamesModel.find({student:req.user?.profile?._id});

    return res.send({
      success: true,
      data: {
        totalquizes: data.length,
        completedquizes: (data.filter((i) => {
          return i.result == "fail";
        }).length) + (data.filter((i) => {
          return i.result == "pass";
        }).length),
        failquizes: data.filter((i) => {
          return i.result == "fail";
        }).length,
        passquizes: data.filter((i) => {
          return i.result == "pass";
        }).length,
        // totalgames:data1.length,
        // passgames:data1.filter((i)=>{return i.result=="pass"}).length,
      },
      message: "Result get successfully",
    });
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
};

exports.myFeedBacks = asyncHandler(async (req, res) => {
  try {
    const findTeacher = await FeedbackModel.find({
      to: req.user.profile._id,
    }).populate({
      path: "teacher",
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
