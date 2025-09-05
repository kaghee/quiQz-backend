import { QueryResult } from "pg"
import pool from "../db"
import { type Request, type Response, Router } from "express"
import {
  DuplicateError,
  processAndSaveQuiz,
  updateQuizBlocks,
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

QuizRouter.patch("/:id/", async (req: Request, res: Response) => {
  try {
    const quizId = req.params.id
    const blocks = req.body.blocks
    if (!blocks) {
      res.status(400).send("Blocks to be updated not specified.")
    }
    if (quizId) {
      const updatedQuiz = await updateQuizBlocks(blocks)
      res.status(200).send(updatedQuiz)
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
