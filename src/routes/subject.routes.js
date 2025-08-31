const { Router } = require('express');
// const { addsubjects, addTopic, allsubjects, alltopicsofsubject, allLessonsoftopics} = require('../controllers/CurriculumControllers/curriculum');
// const { AddTopics, getAllLessonsOfTopics, getcontentOfLesson } = require('./TopicsControllers/Topics.Controllers');
const { AddSubject, getAlltopicsofsubject, getAllsubjectsbygrade, deleteSubject, updateSubject, getParticularStudentSubjects } = require('../controllers/SubjectController');

const { verifyadmintoken, verifytoken } = require('../middlewares/auth');




const router=Router();



router.route('/').post(verifyadmintoken,AddSubject);
router.route('/grade/:id').get(getAllsubjectsbygrade);
router.route('/grade').get(getAllsubjectsbygrade);

router.route('/:id').delete(verifyadmintoken,deleteSubject);
router.route('/:id').put(verifyadmintoken,updateSubject);

// Student subjects route
router.route('/student/:studentId/subjects').get(verifytoken, getParticularStudentSubjects);





// // Topics
// router.route('/add-topics/:id').post(AddTopics);
// router.route('/add-lessons/:id').post(AddLessons)
// router.route('/get-all-lessonsof-topic/:id').get(getAllLessonsOfTopics)
// router.route('/get-Lesson-Content/:id').get(getcontentOfLesson);
module.exports=router;