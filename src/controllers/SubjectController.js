const subjectModel = require("../models/subject");
const gradeModel = require("../models/grade.models");
const { findOne } = require("../models/student");
const studentModel = require("../models/student");

const asyncHandler = require("../utils/asyncHandler");
const fs = require("fs")
const main = async () => {

  let grades = await gradeModel.find({})
  grades.map(async (i) => {
    let d = await subjectModel.find({ grade: i._id })

  })

  //   [
  // "Dance - open",
  // "drama - open",
  // "integrated arts - open",
  // "Music - open",
  // "visual arts - open",
  // "Core French, Grade 9 Academic FSF1D",
  // "Core French, Grade 9 Open FSF1O",
  // "Extended French, Grade 9 Academic FEF1D",
  // "French Immersion, Grade 9 Academic FIF1D",
  // "MTH1WGrade 9 Issued: 2021 Mathematics",
  // "Introduction to business",
  // "information and communication technology in business",
  // "Issues in Canadian Geography, Grade 9 Academic CGC1D",
  // "ENL1WGrade 9 Issued: 2023 English",
  // "NAC1OGrade 9 Expressions of First Nations, Métis, and Inuit Cultures",
  // "Learning Strategies 1: (GLS1O/GLE1O/GLE2O) Skills for Success in Secondary School, Grade 9, Open",
  // "Learning Strategies 1: (GLS1O/GLE1O/GLE2O) Skills for Success in Secondary School, Grade 9, Open",
  // "Learning Strategies 1: (GLS1O/GLE1O/GLE2O) Skills for Success in Secondary School, Grade 9, Open ",
  // "Healthy Active Living Education, Grade 9 Open PPL1O",
  // "SNC1WGrade 9 Issued: 2022 science",
  // "Food and Nutrition, Grade 9 or 10 Open HFN1O/2O",
  // "Exploring Technologies, Grade 9 Open TIJ1O",
  // "Science"
  //   ].map(async(i)=>{

  // const newSubject = await new subjectModel({
  //   name: i,
  //   grade:grade._id
  //   ,image:i.split(" ")[0]+".jpeg"
  // }).save();

  // grade.subjects.push(newSubject._id);

  // })

  // await grade.save();

}
// main()
exports.AddSubject = asyncHandler(async (req, res) => {
  const { name, grade, image } = req.body;

  try {
    const gradedata = await gradeModel.findById(grade);

    if (!gradedata) {
      throw new Error("Grade not found");
    }

    // Check if the subject already exists by searching for a subject with the same name
    const alreadysubject = await subjectModel.findOne({
      name: name.toLowerCase()
    });

    if (alreadysubject) {
      throw new Error("No duplicate name of subject is acceptable");
    }

    const newSubject = await new subjectModel({
      name: name.toLowerCase(),
      grade,
      image
    }).save();

    gradedata.subjects.push(newSubject._id);
    await gradedata.save();

    return res.status(200).json({
      success: true,
      message: "Subject created",
      data: newSubject
    });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message });
  }
});

exports.getAllsubjectsbygrade = asyncHandler(async (req, res) => {
  try {
    let { id } = req.params;
    if (id) {

      id = id.split(",")
    }

    let data = await subjectModel.find({ grade: { $in: id } }).populate(["grade", "topics", "teachers"]);
    if (data.length > 0) {
      return res.status(200).json({
        success: true,
        data,
        message: "All subjects of grade find successfully"
      });
    } else {
      return res.status(200).json({ success: false, data: [], message: "no data found" });
    }
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message });
  }
});

exports.deleteSubject = async (req, res) => {
  try {

    const { id } = req.params;


    let data = await subjectModel.findById(id)


    if (!data) {
      return res.status(200).json({
        success: false,

        message: "invalid id"
      });
    } else {
      const grade = await gradeModel.findOne({ _id: data.grade })
      grade.subjects.pop(id)
      await grade.save()
      await subjectModel.deleteOne({ _id: id })
      fs.unlink(`./src/uploads/${data.image}`, (e) => { })
      return res.status(200).json({ success: true, message: "subject delete successfully" });
    }
  } catch (e) {

    return res.status(200).json({ success: false, message: e.message });
  }
};


exports.updateSubject = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    let data = await subjectModel.findById(id)
    if (!data) {
      return res.status(200).json({
        success: false,

        message: "invalid id"
      });
    } else {

      await subjectModel.updateOne({ _id: id }, { name: req.body.name.toLowerCase() })
      data.name = req.body.name.toLowerCase()
      return res.status(200).json({ success: true, data, message: "subject updated successfully" });
    }
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message });
  }
});

// exports.getAlltopicsofsubject = asyncHandler(async (req, res) => {
//   const subjectId = req.params.id;
//   try {
//     const topicsOfSubject = await subjectModel
//       .findById({ _id: subjectId })
//       .populate("subjectTopics");
//     if (!topicsOfSubject) {
//       throw new Error("Subject not found");
//     }
//     const subjectTopics = topicsOfSubject.subjectTopics;
//     res
//       .status(201)
//       .json(new ApiResponse(200, subjectTopics, "Topics Found Succesfuly"));
//   } catch (error) {
//     res.status(200).json({ message: error.message });
//   }
// });

// exports.deleteSubjects = asyncHandler(async (req, res) => {
//   const subjectId = req.params.id;

//   try {
//     const findsubject = await subjectModel.findById({ _id: subjectId });
//     if (!findsubject) {
//       throw new Error("subject not found");
//     }
//     const findgrade = await gradeModel.findById(findsubject.gradeId);
//     if (!findgrade) {
//       throw new Error(500, "Grade not found");
//     }
//     //  const findSubjectInteracher=await
//     findgrade.gradeSubjects = findgrade.gradeSubjects.filter(
//       (subject) => subject._id.toString() == !subjectId
//     );
//     await findgrade.save();

//     await findsubject.deleteOne();
//     res
//       .status(200)
//       .json(new ApiResponse(0.2, findsubject, "subject deleted successfuly"));
//   } catch (error) {
//     const errorMessage = error.message || "something went wrong";
//     return res
//       .status(error.status || 500)
//       .json(new ApiResponse(error.status || 500, errorMessage));
//   }
// });

exports.getParticularStudentSubjects = asyncHandler(async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await studentModel.findOne({ auth: studentId })
      .populate({
        path: 'subjects',
        populate: [
          {
            path: 'grade',
            select: 'grade'
          },
          {
            path: 'teachers',
            select: 'auth',
            populate: {
              path: 'auth',
              select: 'fullName userName image'
            }
          }
        ]
      });

    if (!student) {
      return res.status(200).json({
        success: false,
        message: "Student not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: student.subjects,
      message: "Student subjects retrieved successfully"
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});
