import pool from "../db"
import type {
  BlockType,
  QuestionDataType,
  QuestionSlideType,
  QuizData,
  SlideType,
  TitleSlideType,
} from "../types"
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
        "INSERT INTO question (question, answer, difficulty, tags) VALUES ($1, $2, $3, $4) ON CONFLICT (question) DO NOTHING",
        [q.question, q.answer, q.difficulty, q.tags],
      )
    } catch (e: any) {
      console.error("ERROR inserting question:", e)
    }
  }
}

/** Generates the first block (slide) that shows the main quiz data. */
const generateTitleBlock = (quizData: QuizData): BlockType => {
  const questionTypes: string[] = quizData.blocks.reduce(
    (blockTitles: string[], currBlock: BlockType) => {
      if (currBlock.type !== "static") {
        blockTitles.push(
          `${currBlock.type}${currBlock.topic ? `: ${currBlock.topic}` : ""} | `,
        )
      }
      return blockTitles
    },
    [],
  )
  const titleSlideText = questionTypes.join("").slice(0, -3)

  const titleBlock: BlockType = {
    type: "static",
    slides: [
      {
        id: 0,
        type: "title",
        title: quizData.title,
        text: titleSlideText,
        cornerText: `Kvízmester: ${quizData.host}`,
      } as TitleSlideType,
    ],
  }
  return titleBlock
}

/** Extends the given block with a title slide at the beginning. */
const generateBlockTitleSlide = ({
  block,
  slideId,
}: {
  block: BlockType
  slideId: number
}): TitleSlideType => {
  const slideProps: TitleSlideType = {
    id: slideId,
    type: "title",
    title: block.type,
  }
  if (block.topic) {
    slideProps.text = block.topic
  }

  return slideProps
}

/** Adds title slides, indices to each slide, and collects all the question data.
 * Returns an array of questions ready for db insertion,
 * and the quiz data object updated with slide ids.
 */
export const parseQuiz = (quizData: QuizData) => {
  let slideCounter = 1
  const questions: QuestionDataType[] = []
  const blocks: BlockType[] = []

  const titleBlock = generateTitleBlock(quizData)
  blocks.push(titleBlock)

  quizData.blocks.forEach((block) => {
    const slides: SlideType[] = []
    if (block.type !== "static") {
      slides.push(
        generateBlockTitleSlide({
          block,
          slideId: slideCounter++,
        }) as TitleSlideType,
      )
    }

    block.slides.forEach((slide) => {
      slides.push({ ...slide, id: slideCounter++ })
      if (slide.type === "question") {
        questions.push({
          question: (slide as QuestionSlideType).question,
          answer: (slide as QuestionSlideType).answer,
          difficulty: (slide as QuestionSlideType).difficulty ?? null,
          tags: (slide as QuestionSlideType).tags ?? [],
        })
      }
    })
    blocks.push({ ...block, slides })
  })

  const readyQuiz: QuizData = {
    ...quizData,
    blocks,
  }
  return { questions, updatedJson: readyQuiz }
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
