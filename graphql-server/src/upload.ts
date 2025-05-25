import express from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import sharp from 'sharp'

const uploadDir = 'uploads/'
const serverPath = 'graphql-server/'
const router = express.Router()

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})


//@todo this definition is not shared across the frontend-backend, could maybe break things in the future
interface ImageUploadResult  {
  url?: string
  thumbnailUrl?: string
  error?: string
}

const upload = multer({ storage })

router.post('/upload', upload.array("images"), async (req, res) => {
  const files = req.files as Express.Multer.File[]

  if (!files || files.length === 0) return res.status(400).send('No images uploaded. This request should not even have gone through.')

  const results: ImageUploadResult[] = []

  for (const file of files) {
    const originalPath = path.join(uploadDir, file.filename)
    const { name, ext } = path.parse(file.filename)
    const thumbnailName = `${name}_thumbnail${ext}`
    const thumbnailPath = path.join(uploadDir, thumbnailName)

    console.log(
      "Image upload vars: \n", 
      originalPath, 
      "\n",
      name, 
      "\n",
      thumbnailName, 
      "\n",
      thumbnailPath,
      "\n",
    )

    try {
      await sharp(originalPath)
        .resize({ width: 256 })
        .toFile(thumbnailPath)

      results.push({
        url: `${serverPath}${uploadDir}${file.filename}`,
        thumbnailUrl: `${serverPath}${uploadDir}${thumbnailName}`,
      })
    } 
    catch (error) {
      console.error(`Error processing ${file.filename}:`, error)
      /* data decoupling away from the try block, keep those consistent so it can be returned to the client */
    }
  }
  console.log(
    "Image upload response: \n",
    results
  )
  res.json({ results })
})

export default router
