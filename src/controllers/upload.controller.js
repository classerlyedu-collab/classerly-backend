const cloud = require("../config/cloudnaryconfig");
const asyncHandler = require("../utils/asyncHandler");

exports.upload = asyncHandler(async (req, res, next) => {
  console.log(req.file);  // Check if file is coming through

  if (!req.file) {
    return res.status(200).json({ success: false, message: "No file uploaded" });
  }

  try {
    await cloud.uploader.upload(
      "src/uploads/" + req.file.filename,
      (result, err) => {
        console.log('123, ', result);
        console.log('321, ', err);
        if (err) {
          console.log(err);
          return res.status(500).send({ success: false, message: err.message });
        }
        return res.send({ success: true, file: result?.url });  // Fixed 'err' to 'result'
      }
    );
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});