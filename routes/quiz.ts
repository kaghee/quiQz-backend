import { QueryResult } from "pg"
import pool from "../db"
import { type Request, type Response, Router } from "express"
import {
  DuplicateError,
  processAndSaveQuiz,
  updateQuizBlocks,
  updateQuizImages,
} from "../services/quiz"

export const QuizRouter: Router = Router()

QuizRouter.get("/", async (req: Request, res: Response) => {
  let result: QueryResult

  result = await pool.query("SELECT id, title FROM quiz")
  res.status(200).send(result.rows)
})

QuizRouter.get("/:id/", async (req: Request, res: Response) => {
  let result: QueryResult

  result = await pool.query("SELECT * FROM quiz WHERE id = $1", [req.params.id])
  res.status(200).send(result.rows[0])
})

QuizRouter.post("/", (req: Request, res: Response) => {
  res.status(201).send("Quiz created successfully.")
})

QuizRouter.post("/:id/images/", async (req: Request, res: Response) => {
  try {
    const { quizId, slideId, oldKey, newKey, imageUrl } = req.body
    if (!quizId || !slideId || !newKey) {
      res.status(400).send({
        message: "Some params not specified.",
        data: { quizId, slideId, newKey },
      })
      return
    }

    const updateParams: {
      quizId: string
      slideId: string
      newKey: string
      oldKey?: string
      imageUrl?: string
    } = {
      quizId,
      slideId,
      newKey,
    }
    if (oldKey !== undefined) updateParams.oldKey = oldKey
    if (imageUrl !== undefined) updateParams.imageUrl = imageUrl

    const updatedQuiz = await updateQuizImages(updateParams)

    res
      .status(200)
      .send({ message: "Quiz updated successfully.", data: updatedQuiz })
  } catch (e) {
    res.status(500).send("Something went wrong while updating the quiz.")
  }
})

QuizRouter.patch("/:id/", async (req: Request, res: Response) => {
  try {
    const quizId = req.params.id
    const blocks = req.body.blocks
    if (!blocks) {
      res.status(400).send("Blocks to be updated not specified.")
    }
    if (quizId) {
      const updatedQuiz = await updateQuizBlocks(quizId, blocks)
      res
        .status(200)
        .send({ message: "Quiz updated successfully.", data: blocks })
    }
  } catch (e) {
    res.status(500).send("Something went wrong while updating the quiz.")
  }
})

QuizRouter.post("/load/", async (req: Request, res: Response) => {
  try {
    const result = await processAndSaveQuiz(req.body)
    if (result?.quizId) {
      res.status(201).send({
        message: "Questions and quiz added to db.",
        quizId: result.quizId,
      })
    } else {
      res.status(500).send("Something went wrong while loading the quiz.")
    }
  } catch (e: unknown) {
    if (e instanceof DuplicateError) {
      res.status(409).send({ message: e.message })
    } else {
      res.status(400).send("An unknown error occurred.")
    }
  }
})
