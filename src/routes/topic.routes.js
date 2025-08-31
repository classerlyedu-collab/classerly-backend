const { Router } = require('express');
const { verifyadmintoken, verifytoken } = require('../middlewares/auth');
const {AddTopic,getAlltopicsbysubject,deletetopic,updatetopic,getAllLessonsOfTopics,getcontentOfLesson,addlesson,updatelesson} =require("../controllers/Topics.Controllers")
const router=Router();
router.route('/').post(verifyadmintoken,AddTopic);
router.route('/').get(verifytoken, getAlltopicsbysubject);
router.route('/:id').delete(verifyadmintoken,deletetopic);
router.route('/:id').put(verifyadmintoken,updatetopic);


router.route('/lesson').post(verifyadmintoken,addlesson)
router.route('/lesson/:id').put(verifyadmintoken,updatelesson)


router.route('/lesson/:id').get(verifytoken,getAllLessonsOfTopics)
router.route('/lesson/content/:id').get(verifytoken,getcontentOfLesson)

module.exports=router;