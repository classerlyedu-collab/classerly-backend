const { Router } = require("express");

const {
    AdminAddEvent,
    getAllTeachers,
    getTeacherById,
    getAllStudents,
    getStudentById,
    getAllParents,
    getParentById,
    updateUserByAdmin,
    blockUserById,
    unblockUserById,
    getAllQuizzess,
    getQuizById,
    getAllSubjects,
    getTopicsBySubjectId,
    getLessonsByTopicId,
    getAnalyticsForAdmin,
    getMonthlyStudentRegistrations,
    getLessonById,
    editSubject,
    deleteSubject,
    editTopic,
    deleteTopic,
    editLesson,
    deleteLesson,
    getActiveUsers,
    getAllCustomerSubscriptions,
    getQuizPassFailAverages,
    getAllCoupons,
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification,
    getUsersForNotification
} = require("../controllers/admincontrollers");
const { verifyadmintoken } = require("../middlewares/auth");

const router = Router();

// Event route
router.route("/event").post(verifyadmintoken, AdminAddEvent);
// analytics
router.route("/analytics").get(verifyadmintoken, getAnalyticsForAdmin);
// quiz pass/fail averages
router.route("/quiz-stats/:subjectId").get(verifyadmintoken, getQuizPassFailAverages);
// Teachers routes
router.route("/teachers").get(verifyadmintoken, getAllTeachers);
router.route("/teacher/:id").get(verifyadmintoken, getTeacherById);
// Students routes
router.route("/students").get(verifyadmintoken, getAllStudents);
router.route("/student/:id").get(verifyadmintoken, getStudentById);
router.route("/studentRegistrationCount").get(verifyadmintoken, getMonthlyStudentRegistrations);
// Parents routes
router.route("/parents").get(verifyadmintoken, getAllParents);
router.route("/parent/:id").get(verifyadmintoken, getParentById);
// update user
router.put("/updateuser", verifyadmintoken, updateUserByAdmin);
// block user by id
router.put("/block", verifyadmintoken, blockUserById);
router.put("/unblock", verifyadmintoken, unblockUserById);
// quizzess
router.get("/quizzes", verifyadmintoken, getAllQuizzess);
router.get("/quiz/:id", verifyadmintoken, getQuizById);
// subjects
router.get("/subjects", verifyadmintoken, getAllSubjects);
router.put("/editSubject", verifyadmintoken, editSubject);
router.delete("/deleteSubject/:id", verifyadmintoken, deleteSubject);
// topics
router.get("/topics/:id", verifyadmintoken, getTopicsBySubjectId);
router.put("/editTopic", verifyadmintoken, editTopic);
router.put("/deleteTopic", verifyadmintoken, deleteTopic);
// lessons
router.get("/lessons/:id", verifyadmintoken, getLessonsByTopicId);
router.get("/lessons/lessonId/:id", verifyadmintoken, getLessonById);
router.put("/editLesson", verifyadmintoken, editLesson);
router.put("/deleteLesson", verifyadmintoken, deleteLesson);
router.get("/activeusers", verifyadmintoken, getActiveUsers);
router.get("/stripedata", verifyadmintoken, getAllCustomerSubscriptions);
router.get("/coupons", verifyadmintoken, getAllCoupons);

// ==================== NOTIFICATION ROUTES ====================
// Notifications
router.post("/notifications", verifyadmintoken, createNotification);
router.get("/notifications", verifyadmintoken, getAllNotifications);
router.get("/notifications/:id", verifyadmintoken, getNotificationById);
router.put("/notifications/:id", verifyadmintoken, updateNotification);
router.delete("/notifications/:id", verifyadmintoken, deleteNotification);
router.get("/users-for-notification", verifyadmintoken, getUsersForNotification);







module.exports = router;