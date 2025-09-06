const { Router } = require('express');
const { addNewChild, getMyChilds, addfeedback, updatefeedback,
    getMyChildbysubjectId,
    getnotification, markAllNotificationsAsRead, myFeedBacks, getQuizInfo, getMyChildbyId, getMyChildsubjectdata } = require("../controllers/parent.controllers");
const { verifytoken, verifyparenttoken } = require('../middlewares/auth');



const router = Router();


// ###################### Parents Routes #########################
// router.route('/registerParent').post(registerparent);
router.route('/addchild').post(verifyparenttoken, addNewChild);
router.route('/getNotification').get(verifytoken, getnotification);
router.route('/markAllNotificationsAsRead').post(verifytoken, markAllNotificationsAsRead);

router.route('/getMyChildsubjectdata/:id').get(verifyparenttoken, getMyChildsubjectdata);

router.route('/parent/feedback/:id').get(verifyparenttoken, myFeedBacks);

router.route('/mychilds').get(verifyparenttoken, getMyChilds);

router.route('/mychild/:id').get(verifyparenttoken, getMyChildbyId);
router.route('/mychildbysubject/:id').get(verifyparenttoken, getMyChildbysubjectId);


router.route("/getquizinfo/:id").get(verifyparenttoken, getQuizInfo);




module.exports = router;