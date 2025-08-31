const {Router}=require('express');
const { addNewChild, getMyChilds ,addfeedback, updatefeedback,
    getMyChildbysubjectId,
    getnotification,myFeedBacks,getQuizInfo, getMyChildbyId, getMyChildsubjectdata} = require("../controllers/parent.controllers");
const { verifytoken, verifyparenttoken } = require('../middlewares/auth');



const router=Router();


// ###################### Parents Routes #########################
// router.route('/registerParent').post(registerparent);
router.route('/addchild').post(verifytoken,addNewChild);
router.route('/getNotification').get(verifytoken,getnotification);

router.route('/getMyChildsubjectdata/:id').get(verifytoken, getMyChildsubjectdata);

router.route('/parent/feedback/:id').get(verifyparenttoken,myFeedBacks);

router.route('/mychilds').get(verifytoken,getMyChilds);

router.route('/mychild/:id').get(verifytoken,getMyChildbyId);
router.route('/mychildbysubject/:id').get(verifytoken,getMyChildbysubjectId);


router.route("/getquizinfo/:id").get(verifytoken,getQuizInfo);




module.exports=router;