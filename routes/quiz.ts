import express, { type Request, type Response, Router } from "express"
import { QueryResult } from "pg"
import pool from "../db"
// import fs from "fs"
// import multer from "multer"
import { DuplicateError, processAndSaveQuiz } from "../services/quiz"
import type { QuizData } from "../types"

export const QuizRouter: Router = Router()

QuizRouter.get("/", async (req: Request, res: Response) => {
  let result: QueryResult

  result = await pool.query("SELECT * FROM quiz")

  res.send(result.rows)
})

QuizRouter.post("/", (req: Request, res: Response) => {
  res.status(201).send("Quiz created successfully.")
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
      res.status(400).send("Something went wrong while loading the quiz.")
    }
  } catch (e: unknown) {
    if (e instanceof DuplicateError) {
      res.status(409).send({ error: e.message })
    } else {
      res.status(400).send("An unknown error occurred.")
    }
  }
})
