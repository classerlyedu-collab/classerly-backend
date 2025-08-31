const { Router } = require("express");

const {
  addquiz,
  updatestatusquiz,
  addananswer,
  getquizes,
  updatequiz,
  deletequiz,
  addquestion,
  updatequestion,
  deletequestions,
  getstudentquizesbyquizid,
updatestudentquize,
getMyQuizesByResult
} = require("../controllers/quiz.contrroller.js");
const { verifytoken, verifyteachertoken, verifystudenttoken } = require("../middlewares/auth");

const router = Router();
//teacher
router.route("/teacher").post(verifyteachertoken, addquiz);


router.route("/teacher/:id").put(verifyteachertoken, updatequiz);
router.route("/teacher/:id").delete(verifyteachertoken, deletequiz);
router.route("/teacher/student/:id").get(verifyteachertoken, getstudentquizesbyquizid);
router.route("/teacher/s/:id").put(verifytoken, updatestudentquize);

//question
router.route("/teacher/q").post(verifyteachertoken, addquestion);
router.route("/teacher/q/:id").put(verifyteachertoken, updatequestion);
router.route("/teacher/q/:id").delete(verifyteachertoken, deletequestions);

//student
router.route("/student/:id").post(verifystudenttoken, updatestatusquiz);
router.route("/student/myquiz").get(verifystudenttoken, getMyQuizesByResult);

router.route("/student/a/:id").post(verifytoken, addananswer);
router.route("/").get(verifytoken, getquizes);




module.exports = router;