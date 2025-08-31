const { Router } = require("express");
const { verifystudenttoken,verifyadmintoken, verifytoken } = require("../middlewares/auth");
const { addgame, studentgame,getgame } = require("../controllers/gamesController");

const router = Router();
router.route("/game").post(
  verifyadmintoken

    , addgame);
router.route("/game").get(verifytoken, getgame);

router.route("/studentgame/:id").post(verifystudenttoken,studentgame);


module.exports=router;