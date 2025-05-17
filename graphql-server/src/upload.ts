import express from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

const router = express.Router()
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const upload = multer({ storage })

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.')
  /* the url stuff is a bit wonky here, it probably should be up a level in the root of the project? 
  or maybe its good to keep it here so the graphql server does not interfere with the enclosing scope */
  const imageUrl = `graphql-server/uploads/${req.file.filename}`
  res.json({ url: imageUrl })
})

export default router
