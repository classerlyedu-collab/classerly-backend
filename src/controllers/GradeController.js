const gradeModel = require("../models/grade.models");

const asyncHandler = require("../utils/asyncHandler");

// const main=async()=>{
  // ["3","4","5","6","7","8","9","10","11","12"].map(async(i)=>{
  //   const savegrade = new gradeModel({
  //     grade:"Grade "+i
  //   });
  //   await savegrade.save();
  // })
// }

// main()

// exports.deleteGrade = asyncHandler(async (req, res) => {
//   try {
//   } catch (e) {
//     res.status(200).json({ success: false, message: e.message });
//   }
// });

// exports.updateGrade = asyncHandler(async (req, res) => {
//   try {
//   } catch (e) {
//     res.status(200).json({ success: false, message: e.message });
//   }
// });

exports.addGrade = asyncHandler(async (req, res) => {
  const { grade ,image} = req.body;
  try {
    const findSamegrade = await gradeModel.findOne({ grade });

    if (findSamegrade) {
      throw Error("grade already exist");
    }
    const savegrade = new gradeModel({
      grade,image
    });

    await savegrade.save();
    return res.status(200).json({ success: true, data: savegrade });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message });
  }
});

exports.getAllGrades = asyncHandler(async (req, res) => {
  try {
    const allgrades = await gradeModel
      .find()
      .populate(["students", "subjects", "teachers"]);
    return res.status(200).json({
      success: true,
      message: "All grades get succesfully",
      data: allgrades
    });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message });
  }
});

// exports.getAllSubjectsOfGrade = asyncHandler(async (req, res) => {
//   const gradeId = req.params.id;
//   try {
//     const findgrade = await gradeModel
//       .findById({ _id: gradeId })
//       .populate("gradeSubjects");

//     if (!findgrade) {
//       res.status(200).json("grade not found");
//     }
//     const subjects = findgrade.gradeSubjects;

//     res.status(200).json(new ApiResponse(200, subjects, "found sucsessfully"));
//   } catch (e) {
//     res.status(200).json({ success: false, message: e.message });
//   }
// });
