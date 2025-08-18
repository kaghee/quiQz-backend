import pool from "../db"
import type {
  BlockType,
  QuestionDataType,
  QuestionSlideType,
  QuizData,
} from "../types"

export const addQuestionsToDbFromJson = async (data: QuizData) => {
  const questions = extractQuestionsFromJson(data)

  for (const q of questions) {
    try {
      await pool.query(
        "INSERT INTO question (question, answer, difficulty, tags) VALUES ($1, $2, $3, $4)",
        [q.question, q.answer, q.difficulty, q.tags],
      )
    } catch (e) {
      console.log("ERROR:", e)
      continue
    }
  }
}

export const extractQuestionsFromJson = (data: QuizData) => {
  const questions: QuestionDataType[] = data.blocks.reduce(
    (acc: QuestionDataType[], currBlock: BlockType) => {
      if (currBlock.type !== "static") {
        const qs: QuestionSlideType[] = currBlock.slides.filter(
          (slide) => slide.type === "question",
        ) as QuestionSlideType[]

        acc.push(
          ...qs.map((q: QuestionSlideType) => ({
            question: q.question,
            answer: q.answer,
            difficulty: q.difficulty ?? null,
            tags: q.tags ?? [],
          })),
        )
      }
      return acc
    },
    [],
  )

  return questions
}
