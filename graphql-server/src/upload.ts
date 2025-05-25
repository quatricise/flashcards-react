import express from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import sharp from 'sharp'

const uploadDir = 'uploads/'
const router = express.Router()

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})


//@todo this definition is not shared across the frontend-backend, could maybe break things in the future
type ImageUploadResult = {
  url: string,
  thumbnailUrl: string,
}

const upload = multer({ storage })

router.post('/upload', upload.array("images"), async (req, res) => {

  // console.log('Files:', req.files);
  // console.log('Body:', req.body);

  const files = req.files as Express.Multer.File[]

  if (!files || files.length === 0) return res.status(400).send('No images uploaded. This request should not even have gone through.')

  const results: ImageUploadResult = []

  for (const file of files) {
    const originalPath = path.join(uploadDir, file.filename)
    const { name, ext } = path.parse(file.filename)
    const thumbnailName = `${name}_thumbnail${ext}`
    const thumbnailPath = path.join(uploadDir, thumbnailName)

    try {
      await sharp(originalPath)
        .resize({ width: 256 })
        .toFile(thumbnailPath)

      results.push({
        url: `/${uploadDir}${file.filename}`,
        thumbnailUrl: `/${uploadDir}${thumbnailName}`,
      })
    } 
    catch (error) {
      console.error(`Error processing ${file.filename}:`, error)
      results.push({
        url: `/${uploadDir}${file.filename}`,
        error: 'Thumbnail creation failed',
      })
    }
  }

  res.json({ images: results })
})


/* the url stuff is a bit wonky here, it probably should be up a level in the root of the project? 
or maybe its good to keep it here so the graphql server does not interfere with the enclosing scope */
// const imageUrl = `graphql-server/uploads/${req.file.filename}`
// res.json({ url: imageUrl })

export default router
