const { Router } = require('express');
const { addNewChild, removeChild, getMyChilds, addfeedback, updatefeedback,
    getMyChildbysubjectId,
    getnotification, markAllNotificationsAsRead, myFeedBacks, getQuizInfo, getMyChildbyId, getMyChildsubjectdata } = require("../controllers/parent.controllers");
const { verifytoken, verifyparenttoken } = require('../middlewares/auth');



const router = Router();


// ###################### Parents Routes #########################
// router.route('/registerParent').post(registerparent);
router.route('/addchild').post(verifyparenttoken, addNewChild);
router.route('/removechild/:id').delete(verifyparenttoken, removeChild);
router.route('/getNotification').get(verifytoken, getnotification);
router.route('/markAllNotificationsAsRead').post(verifytoken, markAllNotificationsAsRead);

// Allow parents and teachers — both legitimately need to see a student's subject progress
router.route('/getMyChildsubjectdata/:id').get(verifytoken, getMyChildsubjectdata);

router.route('/parent/feedback/:id').get(verifyparenttoken, myFeedBacks);

router.route('/mychilds').get(verifyparenttoken, getMyChilds);

router.route('/mychild/:id').get(verifyparenttoken, getMyChildbyId);
// Allow parents and teachers — same data lookup, no ownership-gated logic inside
router.route('/mychildbysubject/:id').get(verifytoken, getMyChildbysubjectId);


router.route("/getquizinfo/:id").get(verifyparenttoken, getQuizInfo);




module.exports = router;