const express = require("express");
const app = express();
const cors = require("cors");
const cookieparser = require("cookie-parser");
const path = require("path");
const paymentRoutes = require("./routes/payment.routes")
const couponRoutes = require("./routes/coupon.routes");
const commentRoutes = require("./routes/comment");

// Raw body parser for Stripe webhooks (must come before regular JSON parser)
app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));

app.use(express());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "50mb" }));

app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
  : "*";

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);



//routes

app.get("", (req, res) => {
  res.send("Welcome to classerly")
})

app.use("/api/v1/payment", paymentRoutes);
const subjectRoutes = require("./routes/subject.routes");
const parentRoutes = require("./routes/parent.routes");
const teacherRoutes = require("./routes/teacher.routes");
const adminRoutes = require("./routes/admin.routes");

const gradeRoutes = require("./routes/grade.routes");
const authRoutes = require("./routes/auth.routes");
const uploadRoutes = require("./routes/upload.routes");
const topicRoutes = require("./routes/topic.routes");

const quizRoutes = require("./routes/quiz.routes")
// const studentRoutes = require("./utils/adddummydata");
const studentRoutes = require("./routes/student.routes")
const gameRoutes = require("./routes/game.routes")
// const adddata = require("./utils/adddummydata");
const bodyParser = require("body-parser");

//declare
// adddata();

// Middleware for other routes

// app.use(
//   bodyParser.json({
//       verify: function(req, res, buf) {
//           req.rawBody = buf;
//       }
//   })
// );


// app.use(express.json({
//   verify: (req, res, buf) => {
//     if (req.originalUrl.startsWith('/api/v1/webhook')) {
//       req.rawBody = buf.toString();
//     }
//   },
//    }));


// app.use(bodyParser.json())
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// 🚨 Apply raw body parser only for Stripe Webhooks before other middlewares
// app.use("/api/v1/webhook", bodyParser.raw({ type: "application/json" }));
// app.use("/api/v1/webhook", express.raw({ type: 'application/json' }));

app.use("/api/v1/student", studentRoutes);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", uploadRoutes);
app.use("/api/v1/grade", gradeRoutes);
app.use("/api/v1/subject", subjectRoutes);
app.use("/api/v1/topic", topicRoutes);
app.use("/api/v1", parentRoutes);

app.use("/api/v1/coupon", couponRoutes);

app.use("/api/comments", commentRoutes);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: process.env.UPLOAD_CACHE_MAX_AGE || 3600000, // Set cache expiry for 1 hour (optional)
  })
);


// app.use('/api/v1/curriculum',curriculumRoutes);
app.use("/api/v1/teacher", teacherRoutes);
app.use("/api/v1/quiz", quizRoutes);
app.use("/api/v1/", gameRoutes);



app.use("/api/v1/admin", adminRoutes);
module.exports = app;
