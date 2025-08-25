import { type Request, type Response, Router } from "express"
import multer from "multer"
import { uploadImage } from "../services/image"

const upload = multer()

export const ImageRouter: Router = Router()

ImageRouter.post(
  "/",
  upload.single("image"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).send({ error: "No file attached." })
    } else {
      const file = req.file
      const [quizTitle, slideNo, fileName] =
        file?.originalname.split("---") || []

      if (!quizTitle || !slideNo || !fileName) {
        res.status(400).send({
          error: "No quiz title or slide id found on the attached file.",
        })
        return
      }

      // TODO: check how this can be null
      const imageIndex = fileName?.split("--")[0]?.split(".")[0] || "0"
      const path = `/${quizTitle}/${slideNo}/`

      const downloadUrl = await uploadImage({
        file,
        path,
        fileName,
        quizTitle,
        slideNo,
        imageIndex,
      })

      res.status(201).send({
        url: downloadUrl,
      })
    }
  },
)
