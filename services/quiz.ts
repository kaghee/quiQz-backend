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
      console.log("ERROR adding question", e)
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

export const processAndSaveQuiz = async (
  data: QuizData,
): Promise<{ quizId?: number } | undefined> => {
  try {
    await addQuestionsToDbFromJson(data)
    const result = await pool.query(
      "INSERT INTO quiz (title, date, blocks) VALUES ($1, $2, $3) RETURNING id",
      [data.title, data.date, JSON.stringify(data.blocks)],
    )
    return { quizId: result.rows[0].id }
  } catch (e) {
    if (e instanceof Error && e.message.includes("duplicate key")) {
      throw new Error("A quiz with this title already exists.")
    }
  }
}
