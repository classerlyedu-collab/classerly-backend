const jwt = require("jsonwebtoken");

const tokengenerate = (user) => {
  return (token = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET));
};

const verifytoken = (req, res, next) => {
  let token =
    req.body.authorization ||
    req.query.authorization ||
    req.headers["authorization"];
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    token = token.split(" ")[1];
    // console.log(token);

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.user = decoded.user;
  } catch (err) {
    return res.status(200).send({ message: err.message });
  }

  return next();
};
const verifyadmintoken = (req, res, next) => {
  let token =
    req.body.authorization ||
    req.query.authorization ||
    req.headers["authorization"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.user.userType != "Admin") {
      return res.status(200).send({ message: "Only admin have credentials" });
    }
    req.user = decoded.user;
  } catch (err) {
    return res.status(200).send({ message: err.message });
  }
  return next();
};
const verifyparenttoken = (req, res, next) => {
  let token =
    req.body.authorization ||
    req.query.authorization ||
    req.headers["authorization"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.user.userType != "Parent") {
      return res.status(200).send({ message: "Only parent have credentials" });
    }
    req.user = decoded.user;
  } catch (err) {
    return res.status(200).send({ message: err.message });
  }
  return next();
};
const verifyteachertoken = (req, res, next) => {
  let token =
    req.body.authorization ||
    req.query.authorization ||
    req.headers["authorization"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (
      decoded.user.userType !== "Teacher" &&
      decoded.user.userType !== "Admin"
    ){
      return res.status(200).send({ message: "Only teacher have credentials" });
    }    
    req.user = decoded.user;
  } catch (err) {
    return res.status(200).send({ message: err.message });
  }
  return next();
};
const verifystudenttoken = (req, res, next) => {
  let token =
    req.body.authorization ||
    req.query.authorization ||
    req.headers["authorization"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.user.userType != "Student") {
      return res.status(200).send({ message: "Only Student have credentials" });
    }
    req.user = decoded.user;
  } catch (err) {
    return res.status(200).send({ message: err.message });
  }
  return next();
};
module.exports = {
  tokengenerate,
  verifytoken,
  verifyadmintoken,
  verifyparenttoken,
  verifyteachertoken,
  verifystudenttoken,
};
