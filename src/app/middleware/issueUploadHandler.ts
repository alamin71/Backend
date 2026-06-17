import multer from 'multer';

const ALLOWED_MIMES = [
  // images
  'image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/svg+xml',
  // audio
  'audio/mpeg', 'audio/mp3', 'audio/wav',
  // video
  'video/mp4', 'video/mpeg', 'video/webm',
  // docs
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const issueUploadHandler = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10,
  },
});

export { issueUploadHandler };
