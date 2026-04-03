const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('./index');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let subDir = 'checkin';
    if (req.originalUrl && req.originalUrl.includes('weight')) {
      subDir = 'weight';
    } else if (req.originalUrl && req.originalUrl.includes('photo')) {
      subDir = 'photo';
    }
    cb(null, path.join(config.upload.dir, subDir));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 JPG、PNG、GIF、WEBP 格式的图片'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

module.exports = upload;
