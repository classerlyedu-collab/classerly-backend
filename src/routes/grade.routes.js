const {Router}=require('express');
const {addGrade,deleteGrade,updateGrade,getAllGrades,getAllSubjectsOfGrade } = require('../controllers/GradeController');
const { verifyadmintoken } = require('../middlewares/auth');

const router=Router();


router.route('/').post(verifyadmintoken,addGrade);
// router.route('/').delete(verifyadmintoken,deleteGrade);
// router.route('/').put(verifyadmintoken,updateGrade);
router.route('/').get(getAllGrades);
// router.route("/:id").get(getAllSubjectsOfGrade)
module.exports=router;