const topicModel = require("../models/topic");
const gradeModel = require("../models/grade.models");
const LessonsModel = require("../models/LessonsModel");
const { find, findById } = require("../models/student");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const subjectModel = require("../models/subject");
const { default: mongoose } = require("mongoose");
const fs = require("fs");
const XLSX = require("xlsx");

function uniquedata(data) {
  const result = {};
  // Iterate through each object in the array
  for (var i = 0; i < data.length; i++) {
    let val = Object.keys(data[i]);
    let val2 = Object.values(data[i]);
    for (var j = 0; j < val.length; j++) {
      if (!result[val[j]]) {
        result[val[j]] = [];
      }
      result[val[j]].push(
        val2[j]
          .replace(`\n`, " ")
          .replace(`\r`, " ")
          .replace(`/`, " ")
          .replace("\n", " ")
          .replace("\r", " ")
      );
    }
  }

  return result;
}
const main = async () => {
  //   const workbook = XLSX.readFile('./Ontario curriculum.xlsx'); // Replace with your Excel file path
  // const sheetName = workbook.SheetNames[0]; // Read the first sheet (adjust if necessary)
  // const sheet = workbook.Sheets[sheetName];

  // // Convert to JSON
  // const jsonData = XLSX.utils.sheet_to_json(sheet);
  // let data = uniquedata(jsonData, null, 2);
  // fs.writeFileSync('data3.json', JSON.stringify(data, null, 2));

  fs.readFile(__dirname + "/data2.json", "utf8", async (e, d) => {
    let keys = Object.keys(JSON.parse(d));
    let values = Object.values(JSON.parse(d));

    keys.map(async (item, i) => {
      let grade = await gradeModel.findOne({ grade: item });
      if (grade) {
        values[i].map(async (item2, j) => {
          if (!item2.includes("https")) {
            try {
              await subjectModel.findOneAndUpdate(
                {
                  grade: grade._id,
                  name: item2.trim(),
                },
                {
                  $set: {
                    grade: grade._id,
                    name: item2.trim(),
                    topics: [],
                    image: values[i][j + 1],
                  },
                },
                { upsert: true }
              );
            } catch (err) { }
          }
        });
      }
    });
  });

  //   let subject= await subjectModel.findOne({name:"Scienve"})

  //   let arr = [
  //     {topic:"A1",lessons:[
  //       {l:"A1.1",p:6,w:1261},
  //     {l:"A1.2",p:8,w:2189},
  //     {l:"A1.3",p:4,w:1315},
  //     {l:"A1.4",p:8,w:1801},
  //     {l:"A1.5",p:8,w:2059},
  //     ]},
  //     {topic:"B1",lessons:[
  //       {l:"B1.1 Relating Science to Our Changing World",p:8,w:1606},
  //       {l:"B1.2 Relating Science to Our Changing World",p:7,w:1649},
  //       ]},
  //     {topic:"B2",lessons:[
  //       {l:"B2.1 Investigating and Understanding Concepts",p:7,w:1704},
  //       {l:"B2.2 Exploring Ecosystem Equilibrium",p:6,w:1502},
  //       {l:"B2.3 Photosynthesis and Cellular Respiration",p:8,w:1843},
  //       {l:"B2.4 Introduction to Ecosystem Sustainability",p:7,w:1590},
  //       {l:"B2.5 Understanding the Dynamic Equilibrium of Ecosystems",p:8,w:1749},

  //     ]},
  //     {topic:"C1",lessons:[
  //     {l:"C1.1",p:7,w:1676},

  //     {l:"C1.2",p:8,w:1839},

  //       ]},
  //     {topic:"C2",lessons:[
  //     {l:"C2.1",p:9,w:7690},
  //     {l:"C2.2",p:7,w:1554},
  //     {l:"C2.3",p:7,w:1602},
  //     {l:"C2.4",p:6,w:1538},
  //     {l:"C2.5",p:6,w:1321},
  //     {l:"C2.6",p:7,w:1588},
  //     {l:"C2.7",p:7,w:1615},

  //    ]},
  //     {topic:"D1",lessons:[
  //       {l:"D1.1",p:1,w:1646},
  //       {l:"D1.2",p:7,w:1860},
  //       {l:"D1.3",p:7,w:1530},
  //       {l:"D1.4",p:7,w:1499}
  //       ]},
  //     {topic:"D2",lessons:[
  //       {l:"D2.1",p:7,w:1871},
  //       {l:"D2.2",p:7,w:1651},
  //       {l:"D2.3",p:7,w:1554},
  //       {l:"D2.4",p:8,w:1667},
  //       {l:"D2.5",p:7,w:1441},
  //       {l:"D2.6",p:7,w:1655},
  //       {l:"D2.7",p:2,w:1562},
  //       {l:"D2.8",p:7,w:1416},

  //       ]},
  //     {topic:"E1",lessons:[
  //       {l:"E1.1",p:7,w:1722},
  //       {l:"E1.2",p:7,w:1715},
  //       {l:"E1.3",p:7,w:1431},
  //     ]},
  //     {topic:"E2",lessons:[
  //       {l:"E2.1",p:2,w:555},
  //       {l:"E2.2",p:7,w:1477},
  //       {l:"E2.3",p:7,w:1893},
  //       {l:"E2.4",p:7,w:1802},
  //       {l:"E2.5",p:7,w:1725},
  //       {l:"E2.6",p:6,w:1263},
  //     ]},
  //     {topic:"Strand A",lessons:[
  //       {l:"A1. STEM Investigation Skills",p:16,w:4275},
  //       {l:"A2. Applications, Careers, and Connections",p:16,w:3809},
  //       ]},
  //     {topic:"Strand B",lessons:[
  //       {l:"B1. Relating Science to Our Changing World",p:15,w:3617},
  //       {l:"B2. Investigating and Understanding Concepts",p:15,w:4086},
  //       ]},
  //     {topic:"Strand C",lessons:[
  //       {l:"C1. Relating Science to Our Changing World",p:16,w:4262},
  //       {l:"C2. Investigating and Understanding Concepts",p:15,w:3949},
  //       ]},
  //     {topic:"Strand D",lessons:[
  //       {l:"D1. Relating Science to Our Changing World",p:18,w:4348},
  //       {l:"D2. Investigating and Understanding Concepts",p:20,w:4670},
  //       ]},
  //     {topic:"Strand E",lessons:[
  //       {l:"E1. Relating Science to Our Changing World",p:18,w:4414},
  //       {l:"E2. Investigating and Understanding Concepts_",p:15,w:4161},

  //       ]}]

  //       arr.forEach(async(i)=>{
  //         const newTopic =new topicModel({
  //           name: i.topic,
  //           image:i.topic.split(" ")[0]+".jpeg",
  //           subject:subject._id
  //         })

  //     i.lessons.map(async(j)=>{
  //       const data = await (new LessonsModel({
  //         name: j.l,
  //         pages:j.p,
  //         content:"Science/"+i.topic+"/"+j.l+".docx",
  //         image:j.l.split(" ")[0]+".jpeg",
  //         topic:newTopic._id,
  //         words:j.w,
  //       })).save();
  //       newTopic.lessons.push(data._id);
  //     })
  //     await newTopic.save();
  //   })
};
// main();

exports.AddTopic = asyncHandler(async (req, res) => {
  const { name, image, subject, difficulty, type } = req.body;

  try {
    const findSubject = await subjectModel.findById(subject).populate("topics");
    if (!findSubject) {
      throw new Error("Subject not found");
    }
    const findTopic = await topicModel.findOne({
      name: name.toLowerCase(),
      subject,
    });
    if (findTopic) {
      throw new Error("Topic with this name already exists in this subject");
    }
    if (!["Beginner", "Medium", "Advanced"].includes(difficulty)) {
      throw new Error(
        "difficulty is not valid. it only be Beginner,Medium or Advanced "
      );
    }
    const newTopic = await new topicModel({
      name: name.toLowerCase(),
      image,
      subject,
      difficulty,
      type: type ? type : "Standard",
    }).save();

    findSubject.topics.push(newTopic._id);
    await findSubject.save();

    res.status(200).json(newTopic);
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
});

exports.updatetopic = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    let data = await topicModel.findById(id);
    if (!data) {
      throw Error("invalid id");
    } else {
      if (
        req.body.difficulty &&
        !["Beginner", "Medium", "Advanced"].includes(req.body.difficulty)
      ) {
        throw new Error(
          "difficulty is not valid. it only be Beginner,Medium or Advanced "
        );
      }
      if (req.body.name) {
        req.body.name = req.body.name.toLowerCase();
        const findTopic = await topicModel.findOne({ name: req.body.name });
        if (findTopic) {
          throw new Error(
            "Topic with this name already exists in this subject"
          );
        }
      }
      const { name, image, difficulty } = req.body;
      req.body = { name, image, difficulty };
      for (let prop in req.body) {
        if (req.body[prop] === null || req.body[prop] === undefined) {
          delete req.body[prop];
        }
      }
      const updated = await topicModel.findOneAndUpdate({ _id: id }, req.body, {
        new: true,
      });

      return res.status(200).json({
        success: true,
        data: updated,
        message: "topic updated successfully",
      });
    }
  } catch (error) {
    res.status(200).json({ mesage: error.message });
  }
});

exports.getAlltopicsbysubject = asyncHandler(async (req, res) => {
  const { subject } = req.query;

  try {
    const findTopicLesson = await topicModel.aggregate([
      {
        $match: {
          subject: new mongoose.Types.ObjectId(subject),
        },
      },
      {
        $lookup: {
          from: "lessons",
          let: { topicId: { $toString: "$_id" } }, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$topic" }, "$$topicId"], // Convert topic field to string and compare
                },
              },
            },
          ],
          as: "lessons",
        },
      },
      // {
      //   $match:{
      //     "lessons.readyby":{$in:[new mongoose.Types.ObjectId(req.user.profile._id)]}
      //   }
      // },
      {
        $lookup: {
          from: "quizes",
          let: { topicId: { $toString: "$_id" } }, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$topic" }, "$$topicId"], // Convert topic field to string and compare
                },
              },
            },
          ],
          as: "quizes",
        },
      },
      {
        $unwind: {
          path: "$quizes", // Specify the field you want to unwind
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "studentquizes",
          let: {
            topicId: { $toString: "$quizes._id" },
            stdId: { $toString: req.user?.profile?._id },
          }, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [{ $toString: "$quiz" }, "$$topicId"], // Convert topic field to string and compare
                    },
                    {
                      $eq: [{ $toString: "$student" }, "$$stdId"], // Convert topic field to string and compare
                    },
                  ],
                },
              },
            },
          ],
          as: "studentquizes",
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },

          image: { $first: "$image" },

          subject: { $first: "$subject" },
          difficulty: { $first: "$difficulty" },
          type: { $first: "$type" },
          lessons: { $first: "$lessons" },

          // Group by topic ID
          // subject: { $first: "$subject" }, // Keep other fields from the original topic
          // name: { $first: "$name" },
          quizes: {
            $push: {
              _id: "$quizes._id", // Keep quiz fields
              title: "$quizes.createdBy",
              questions: "$quizes.questions",
              status: "$quizes.status",
              grade: "$quizes.grade",
              topic: "$quizes.topic",
              subject: "$quizes.subject",
              image: "$quizes.image",
              endsAt: "$quizes.endsAt",
              startsAt: "$quizes.startsAt",
              studentQuizData: "$studentquizes", // Embed the student quiz data
            },
          },
        },
      },
      {
        $sort: { name: 1 }, // Sort by name in ascending order (A to Z)
      },
    ]);
    // find({ subject });

    if (!findTopicLesson) {
      throw new Error("Topics not found");
    }

    res.status(200).json(
      new ApiResponse(
        200,
        await Promise.all(
          findTopicLesson.map(async (i) => {
            let c = 0;
            await Promise.all(i.lessons.map((j) => {

              if (
                j?.readby
                  ?.map((id) => { return id.toString() })
                  ?.includes(req.user.profile._id.toString())
              ) {
                c++;
              }
            }));
            i.read = (c / i.lessons.length).toFixed(2)

            return i;
          })
        ),
        "lesson found sucessfully"
      )
    );
  } catch (error) {
    res.status(200).json({ mesage: error.message || "somthing went wrong" });
  }
});

exports.deletetopic = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    let data = await topicModel.findById(id);
    if (!data) {
      throw Error("invalid id");
    }

    const findsubject = await subjectModel.findById(data.subject);
    findsubject.topics.pop(id);
    await findsubject.save();
    await topicModel.findOneAndDelete({ _id: id });
    return res.status(200).json({
      success: true,
      message: "topic deleted successfully",
    });
  } catch (error) {
    const errorMessage = error.message || "something went wrong";
    return res
      .status(error.status || 500)
      .json(new ApiResponse(error.status || 500, errorMessage));
  }
});

exports.addlesson = asyncHandler(async (req, res) => {
  try {
    const { name, pages, content, image, lang, topic } = req.body;
    let words = content.length;

    // Check if the topic exists
    const findtopic = await topicModel.findById(topic);
    if (!findtopic) {
      throw Error("Invalid topic Entered");
    }

    // Check if the lesson already exists for the topic
    const alreadylesson = await LessonsModel.find({
      name: name.toLowerCase(),
      topic,
    });

    // If there are any lessons already found, prevent adding the new lesson
    if (alreadylesson.length > 0) {
      throw Error("This lesson already added");
    }

    // Proceed to add the new lesson
    const data = await new LessonsModel({
      name: name.toLowerCase(),
      pages,
      content,
      image,
      lang,
      topic,
      words,
    }).save();

    // Add the new lesson to the topic
    findtopic.lessons.push(data._id);
    await findtopic.save();

    return res.status(200).json({
      success: true,
      data,
      message: "Lesson added successfully",
    });
  } catch (error) {
    const errorMessage = error.message || "Something went wrong";
    return res.status(500).json(new ApiResponse(500, errorMessage));
  }
});


exports.updatelesson = asyncHandler(async (req, res) => {
  try {
    const findLesson = await LessonsModel.findById(req.params.id);
    if (!findLesson) {
      return res.status(200).json(new ApiResponse(404, "Lesson not found"));
    }

    const { name, pages, content, image, lang, topic } = req.body;

    req.body = { name, pages, content, image, lang, topic };
    for (let prop in req.body) {
      if (req.body[prop] === null || req.body[prop] === undefined) {
        delete req.body[prop];
      }
    }
    if (req.body.content.length > 0) {
      req.body.words = req.body.content.length;
    }
    const update = await LessonsModel.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      req.body,
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: update,
      message: "Lesson updated successfully",
    });
  } catch (error) {
    const errorMessage = error.message || "Something went wrong";
    return res.status(200).json(new ApiResponse(500, errorMessage));
  }
});
exports.getcontentOfLesson = asyncHandler(async (req, res) => {
  const LessonId = req.params.id;

  try {
    if (req.user.userType == "Student") {
      await LessonsModel.findByIdAndUpdate(
        LessonId,
        { $addToSet: { readby: req.user.profile._id } } // Add only if not already in array
      );
    }
    const findLesson = await LessonsModel.findById(LessonId, { readyby: 0 });
    if (!findLesson) {
      return res.status(200).json(new ApiResponse(404, "Lesson not found"));
    }

    return res.status(200).json({
      message: "Content Found",
      data: findLesson,
      success: true,
    });
  } catch (error) {
    const errorMessage = error.message || "Something went wrong";
    return res.status(200).json(new ApiResponse(500, errorMessage));
  }
});

exports.getAllLessonsOfTopics = asyncHandler(async (req, res) => {
  const topicId = req.params.id;
  try {
    const findTopicLesson = await LessonsModel.aggregate([
      {
        $match: {
          topic: new mongoose.Types.ObjectId(topicId),
        },
      },
    ]);

    // .populate({ path: "lessons", select: "_id name image" });

    if (!findTopicLesson) {
      throw new Error("Topic not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        findTopicLesson.map((i) => {
          if (
            i?.readby
              ?.map((id) => { return id.toString() })
              ?.includes(req.user.profile._id)
          ) {
            i.status = "complete";
          } else {
            i.status = "incomplete";
          }
          return i;
        }),
        "lesson found sucessfully"
      )
    );
  } catch (error) {
    res.status(200).json({ mesage: error.message || "somthing went wrong" });
  }
});
