import { type Request, type Response, Router } from "express"
import { QueryResult } from "pg"
import pool from "../db"
import multer from "multer"
import { uploadImage } from "../services/image"

export const ImageRouter: Router = Router()

// ImageRouter.get("/", async (_req: Request, res: Response) => {
//   let result: QueryResult

//   result = await pool.query("SELECT * FROM question")
//   res.send(result.rows)
// })

const upload = multer()

ImageRouter.post(
  "/",
  upload.single("image"),
  async (req: Request, res: Response) => {
    let imageUrl
    if (!req.file) {
      res.status(400).send({ error: "No file attached." })
    } else {
      const file = req.file
      const [quizTitle, slideNo, fileName] =
        file?.originalname.split("--") || []
      const remotePath = `/${quizTitle}/${slideNo}/${fileName}`

      const downloadUrl = await uploadImage(file, remotePath)

      res.status(201).send({
        url: downloadUrl,
      })
    }
  },
)
