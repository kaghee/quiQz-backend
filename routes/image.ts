import { type Request, type Response, Router } from "express"
import { QueryResult } from "pg"
import pool from "../db"
import multer from "multer"
import { uploadImage } from "../services/image"

const upload = multer()

export const ImageRouter: Router = Router()

// ImageRouter.get("/", async (_req: Request, res: Response) => {
//   let result: QueryResult

//   result = await pool.query("SELECT * FROM question")
//   res.send(result.rows)
// })

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
        file?.originalname.split("---") || []
      const imageIndex = fileName?.split("--")[0]

      if (!quizTitle || !slideNo) {
        res.status(400).send({
          error: "No quiz title or slide id found on the attached file.",
        })
        return
      }
      const path = `/${quizTitle}/${slideNo}/${fileName}`

      const downloadUrl = await uploadImage({
        file,
        path,
        quizTitle,
        slideNo,
      })

      res.status(201).send({
        url: downloadUrl,
      })
    }
  },
)
