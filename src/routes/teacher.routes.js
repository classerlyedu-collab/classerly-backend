const { Router } = require('express');

const { 
    myFeedBacks,
    mystudents,
    addstudent,
    mydashboard,
    mycourses, 
    addfeedback,
    mysubjects, 
    getCalendarEvents, 
    addCalendarEvent, 
    addComment, 
    getComments,
    addParentFeedback,
    getParentFeedback,
    getAllParentFeedbacks 
} = require('../controllers/TeacherContrroller');
const { verifytoken, verifyteachertoken } = require('../middlewares/auth');

const router=Router();

router.route("/feedback").get(verifytoken, myFeedBacks);
router.route("/dashboard").get(verifytoken, mydashboard);
router.route("/mycourses").get(verifyteachertoken, mycourses);
router.route('/feedback').post(verifyteachertoken,addfeedback);
router.route("/mysubjects").get(verifyteachertoken,mysubjects);
router.route("/mystudents").get(verifyteachertoken, mystudents);
router.route("/addstudent").post(verifyteachertoken, addstudent);

// Parent-Teacher Feedback Routes
router.route("/parent-feedback").post(verifyteachertoken, addParentFeedback);
router.route("/parent-feedback/:studentId/:parentId").get(verifytoken, getParentFeedback);
router.route("/parent-feedbacks/:studentId/:parentId").get(verifytoken, getAllParentFeedbacks);

// Calendar Events Routes
router.route("/calendar/events").get(verifytoken, getCalendarEvents);
router.route("/calendar/events").post(verifytoken, addCalendarEvent);

// Comment Routes
router.route("/comments").post(verifytoken, addComment);
router.route("/comments/:recipientId").get(verifytoken, getComments);

module.exports=router;