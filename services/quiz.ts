import pool from "../db"
import type { BlockType, QuestionDataType, QuizData } from "../types"
import { normalizeText } from "../utils"

export class DuplicateError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = "DuplicateError"
  }
}

/** Inserts questions to the db from a given question array. */
export const addQuestionsToDbFromJson = async (
  questions: QuestionDataType[],
) => {
  for (const q of questions) {
    try {
      await pool.query(
        "INSERT INTO question (question, answer, difficulty, tags) VALUES ($1, $2, $3, $4)",
        [q.question, q.answer, q.difficulty, q.tags],
      )
    } catch (e) {
      console.log("ERROR adding question", e)
      continue
    }
  }
}

/** Adds indices to each slide, and collects all the question data.
 * Returns an array of questions ready for db insertion,
 * and the quiz data object updated with slide ids.
*/
export const parseQuiz = (data: QuizData) => {
  let slideCounter = 0
  const questions: QuestionDataType[] = data.blocks.reduce(
    (acc: QuestionDataType[], currBlock: BlockType) => {
      currBlock.slides.forEach((slide) => {
        slide.id = slideCounter++
        if (slide.type === "question") {
          acc.push({
            question: slide.question,
            answer: slide.answer,
            difficulty: slide.difficulty ?? null,
            tags: slide.tags ?? [],
          })
        }
      })
      return acc
    },
    [],
  )
  return { questions, updatedJson: data }
}

/** Extracts questions from the quiz object and inserts them into the db.
 * After adding slide ids to the object, nserts the quiz to the db.
*/
export const processAndSaveQuiz = async (
  data: QuizData,
): Promise<{ quizId?: number } | undefined> => {
  try {
    const { questions, updatedJson } = parseQuiz(data)
    await addQuestionsToDbFromJson(questions)

    const formattedTitle = normalizeText(updatedJson.title)
    const result = await pool.query(
      "INSERT INTO quiz (title, date, blocks) VALUES ($1, $2, $3) RETURNING id",
      [formattedTitle, updatedJson.date, JSON.stringify(updatedJson.blocks)],
    )
    return { quizId: result.rows[0].id }
  } catch (e) {
    if (e instanceof Error && e.message.includes("duplicate key")) {
      throw new DuplicateError("A quiz already exists with this title.")
    }
  }
}
