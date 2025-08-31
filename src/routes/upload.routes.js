const { Router } = require('express');


const multer = require('multer');
const { upload } = require('../controllers/upload.controller');

// Define the maximum file size (5 MB in bytes)
const maxSize = 5 * 1024 * 1024;

// Configure disk storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'src/uploads/'); // Change 'uploads' to your desired directory
  },
  filename: function (req, file, callback) {

    callback(null, Date.now() + '-' + file.originalname);
  },
});

// Define the upload handler with Multer options
const fileupload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function(req, file, callback) {
    // Optional: You can define allowed file types here

    // if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
    //   return callback(new Error('Only JPG, JPEG, PNG and PDF files are allowed!'), false);
    // }
    callback(null, true);
  },
});

const router=Router();
router.post("/uploadimage",fileupload.single("file"),upload)


module.exports=router;