const { Router } = require('express');
const { register, login, forgotpassword, verifyuser, resetpassword, updateuser,getmyprofile,changepassword } = require('../controllers/auth.controller');
const { verifytoken } = require('../middlewares/auth');
const router=Router();
router.post("/register",register)
router.post("/login",login)
router.post("/forgotpassword",forgotpassword)
router.post("/changepassword",verifytoken,changepassword)

router.post("/verify",verifytoken,verifyuser)
router.post("/restepassword",verifytoken,resetpassword)
router.post("/updateuser",verifytoken,updateuser)
router.get("/profile",verifytoken,getmyprofile)
module.exports=router;