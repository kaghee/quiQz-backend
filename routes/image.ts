import { type Request, type Response, Router } from "express"
import multer from "multer"
import {
  deleteConcreteImage,
  ImageDeletionError,
  uploadImage,
} from "../services/image"

const upload = multer()

export const ImageRouter: Router = Router()

ImageRouter.post(
  "/",
  upload.single("image"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).send({ message: "No file attached." })
    } else {
      const file = req.file
      const [quizTitle, slideNo, imageId, fileName] =
        file?.originalname.split("---") || []

      if (
        !quizTitle?.length ||
        !slideNo?.length ||
        !fileName?.length ||
        !imageId?.length
      ) {
        res.status(400).send({
          message: "No quiz title or slide id found on the attached file.",
        })
        return
      }

      const imageIndex = fileName.split(".")[0] || "0"
      const path = `/${quizTitle}/${slideNo}/`

      const downloadUrl = await uploadImage({
        file,
        path,
        fileName,
        quizTitle,
        slideNo,
        imageIndex,
        imageId,
      })

      res.status(201).send({
        url: downloadUrl,
      })
    }
  },
)

ImageRouter.post("/delete", async (req: Request, res: Response) => {
  if (!req.body.path || !req.body.fileIndex) {
    res.status(400).send({
      message: "No exact file path specified.",
    })
  }

  try {
    await deleteConcreteImage(req.body.path, req.body.fileIndex)
    res.status(204).send()
  } catch (e) {
    if (e instanceof ImageDeletionError) {
      res.status(500).send({ message: e.message })
    } else {
      res.status(500).send("Deleting the image failed.")
    }
  }
})