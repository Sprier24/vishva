import nextConnect from 'next-connect';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = './public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Something went wrong: ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  },
});

apiRoute.use(upload.single('image')); 

apiRoute.post((req, res) => {
  res.status(200).json({ message: 'File uploaded successfully!', filePath: `/uploads/${req.file.filename}` });
});

export default apiRoute;

export const config = {
  api: {
    bodyParser: false,
  },
};
