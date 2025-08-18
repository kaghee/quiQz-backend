import { type Request, type Response, Router } from "express"
import { QueryResult } from "pg"
import pool from "../db"

export const QuestionRouter: Router = Router()

QuestionRouter.get("/", async (_req: Request, res: Response) => {
  let result: QueryResult

  result = await pool.query("SELECT * FROM question")
  res.send(result.rows)
})

QuestionRouter.post("/", async (req: Request, res: Response) => {
  const { text, answer, difficulty, tags } = req.body
  const { rows } = await pool.query(
    "INSERT INTO question (text, answer, difficulty, tags) VALUES ($1, $2, $3, $4)",
    [text, answer, difficulty, tags],
  )

  res.status(201).send({
    data: {
      text,
      answer,
      difficulty,
      tags,
    },
  })
})
