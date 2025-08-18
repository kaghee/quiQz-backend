import express, { type Request, type Response, Router } from "express"
import { QueryResult } from "pg"
import pool from "../db"
// import fs from "fs"
// import multer from "multer"
import {
  addQuestionsToDbFromJson,
  extractQuestionsFromJson,
} from "../services/quiz"

export const QuizRouter: Router = Router()

// interface MulterRequest extends Request {
//   file?: Express.Multer.File | undefined
// }

QuizRouter.get("/", async (req: Request, res: Response) => {
  let result: QueryResult

  result = await pool.query("SELECT * FROM quiz")

  res.send(result.rows)
})

QuizRouter.post("/", (req: Request, res: Response) => {
  console.log("req!!!!1:", req.body)

  res.status(201).send("Quiz created successfully.")
})

QuizRouter.post(
  "/upload/",
  (req: Request, res: Response) => {
    addQuestionsToDbFromJson(req.body)
  },
  //   if (!req.file) {
  //     return res.status(400).json({ error: "No file uploaded" })
  //   }
  //   fs.readFile(req.file.path, (err, data) => {
  //     if (err) {
  //       return res.status(500).json({ error: "Failed to read file" })
  //     }
  //     if (req.file) {
  //       addQuestionsToDbFromJson(JSON.parse(data.toString()))

  //       // res.json({
  //       //   message: "File uploaded successfully",
  //       //   filename: req.file.filename,
  //       // })
  //     }
  //   })
  // },
)
// File size limit: 1 MB
// const upload = multer({ dest: "files/", limits: { fileSize: 1048576 } })

// QuizRouter.post(
//   "/upload",
//   upload.single("quizJson"),
//   (req: MulterRequest, res: Response) => {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" })
//     }
//     fs.readFile(req.file.path, (err, data) => {
//       if (err) {
//         return res.status(500).json({ error: "Failed to read file" })
//       }
//       if (req.file) {
//         addQuestionsToDbFromJson(JSON.parse(data.toString()))

//         // res.json({
//         //   message: "File uploaded successfully",
//         //   filename: req.file.filename,
//         // })
//       }
//     })
//   },
// )
