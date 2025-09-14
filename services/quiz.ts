import pool from "../db"
import { findSlideInBlocks, normalizeText } from "../utils"
import type {
  BlockType,
  QuestionDataType,
  QuestionSlideType,
  QuizDataRequest,
  QuizData,
  SlideType,
  TitleSlideType,
  UpdateQuizImagesRequestType,
  ImageMeta,
} from "../types"

const WHO_AM_I_POINTS = [5, 3, 2, 1]

export class DuplicateError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = "DuplicateError"
  }
}

/** Inserts a question to the db from a given question object. */
export const addQuestionToDb = async (q: QuestionDataType) => {
  try {
    await pool.query(
      "INSERT INTO question (question, answer, difficulty, tags) VALUES ($1, $2, $3, $4) ON CONFLICT (question) DO NOTHING",
      [q.question, q.answer, q.difficulty, q.tags],
    )
  } catch (e: any) {
    console.error("ERROR inserting question:", e)
  }
}

/** Inserts questions to the db from a given question array. */
export const addQuestionsToDbFromJson = async (
  questions: QuestionDataType[],
) => {
  for (const q of questions) {
    await addQuestionToDb(q)
  }
}

/** Generates the first block (slide) that shows the main quiz data. */
const generateTitleBlock = (quizData: QuizDataRequest): BlockType => {
  const allBlocks = quizData.firstHalf.blocks.concat(quizData.secondHalf.blocks)
  const questionTypes: string[] = allBlocks.reduce(
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
        type: "title",
        title: quizData.title,
        text: titleSlideText,
        cornerElement: `<div>Kvízmester: ${quizData.host}</div>`,
      } as TitleSlideType,
    ],
  }
  return titleBlock
}

/** Extends the given block with a title slide at the beginning. */
const generateBlockTitleSlide = (block: BlockType): Partial<TitleSlideType> => {
  const slideProps: Partial<TitleSlideType> = {
    type: "title",
    title: block.type,
  }
  if (block.topic) {
    slideProps.text = block.topic
  }

  return slideProps
}

const generateWhoAmISlides = (
  block: BlockType,
): Partial<QuestionSlideType>[] => {
  if (!block.blockQuestion || !block.blockAnswer) return []

  return block.blockQuestion.map((_q, index) => {
    return {
      type: "question",
      questionTitle: `Kérdezz! Felelek: ${WHO_AM_I_POINTS[index]} pont`,
      question: block.blockQuestion?.slice(0, index + 1) || [],
      answer: block.blockAnswer as string,
    }
  })
}

const generateHalf = ({
  blocks,
  isSecondHalf = false,
}: {
  blocks: BlockType[]
  isSecondHalf?: boolean
}) => {
  const quizSection: BlockType[] = []

  let whoAmISlides: Partial<SlideType>[] = []
  let whoAmIBlocks: BlockType[] = []
  const whoAmIData = blocks.find((block) => block.type === "Kérdezz! Felelek")
  if (whoAmIData) {
    whoAmISlides = generateWhoAmISlides(whoAmIData)

    whoAmIBlocks = whoAmISlides.map((slide) => ({
      type: "Kérdezz! Felelek",
      background: whoAmIData.background || "",
      textColour: whoAmIData.textColour || "",
      slides: [slide as QuestionSlideType],
    }))

    if (whoAmIData.blockAnswer && whoAmIData.blockQuestion) {
      addQuestionToDb({
        question: whoAmIData.blockQuestion,
        answer: whoAmIData.blockAnswer,
      })
    }
  }

  /* Add slide for starting the second part. The checking prop warns FE that
  checking mode should be turned off. */
  if (isSecondHalf) {
    quizSection.push({
      type: "static",
      slides: [
        {
          type: "title",
          title: "Szünet",
          checking: "off",
        } as TitleSlideType,
      ],
    } as BlockType)
  }

  if (isSecondHalf && whoAmIBlocks?.length) {
    quizSection.push(whoAmIBlocks.shift() as BlockType)
  }

  blocks.forEach((block) => {
    if (block.type === "Kérdezz! Felelek") return

    const slides: Partial<SlideType>[] = []

    /* Add title slide to question block */
    if (block.type !== "static") {
      slides.push(generateBlockTitleSlide(block) as TitleSlideType)
    }

    /* Add the slides themselves. In case of question slides,
    add the question to the db as well. */
    if (block.slides) {
      block.slides.forEach((slide, index) => {
        let cornerElement

        /* Add bonus point indicators */
        if (block.type === "Kapcsolat kör") {
          if (index === 1) {
            cornerElement = '<div class="bonus-3">3 BP</div>'
          } else if (index === 2) {
            cornerElement = '<div class="bonus-2">2 BP</div>'
          } else if (index === 3) {
            cornerElement = '<div class="bonus-1">1 BP</div>'
          }
        }

        const newSlide = { ...slide }
        if (cornerElement) newSlide.cornerElement = cornerElement
        slides.push(newSlide)

        if (
          slide.type === "question" &&
          (slide as QuestionSlideType).question?.length
        ) {
          addQuestionToDb({
            question: (slide as QuestionSlideType).question,
            answer: (slide as QuestionSlideType).answer,
            difficulty: (slide as QuestionSlideType).difficulty ?? null,
            tags: (slide as QuestionSlideType).tags ?? [],
          })
        }
      })
    }

    /* Add 'Mi a kapcsolat?' slide */
    if (block.type === "Kapcsolat kör" && block.blockAnswer) {
      slides.push({
        type: "question",
        question: ["Mi a kapcsolat az 1-6. kérdések válaszai között?"],
        answer: block.blockAnswer,
      } as QuestionSlideType)
    }
    quizSection.push({ ...block, slides: slides as SlideType[] })

    /* Add "Kérdezz! Felelek" slide */
    if (isSecondHalf && whoAmIBlocks?.length) {
      quizSection.push(whoAmIBlocks.shift() as BlockType)
    }
  })

  /* Add "Megoldások" slide */
  const answersTitleBlock: BlockType = {
    type: "static",
    slides: [
      {
        type: "title",
        title: "Megoldások",
      } as TitleSlideType,
    ],
  }
  quizSection.push(answersTitleBlock)

  return quizSection
}

/** Adds ids to all the slides in the generated blocks. */
const addIdsToSlides = (blocks: BlockType[]) => {
  let slideId = 0
  let quizBlocks = [...blocks]

  quizBlocks.forEach((block) => {
    block.slides.forEach((slide) => {
      slide.id = slideId++
    })
  })
  return quizBlocks
}

/** Adds title slides, indices to each slide, and collects all the question data.
 * If there is a "Who Am I" block, generates its slides and inserts them into the quiz.
 * Returns an array of questions ready for db insertion,
 * and the quiz data object updated with slide ids.
 */
export const parseQuiz = (quizData: QuizDataRequest) => {
  const questions: QuestionDataType[] = []
  let quizBlocks: BlockType[] = []

  const titleBlock = generateTitleBlock(quizData)
  quizBlocks.push(titleBlock)

  if (quizData.firstHalf) {
    quizBlocks.push(
      ...generateHalf({
        blocks: quizData.firstHalf.blocks,
      }),
    )
  }
  if (quizData.secondHalf) {
    quizBlocks.push(
      ...generateHalf({
        blocks: quizData.secondHalf.blocks,
        isSecondHalf: true,
      }),
    )
  }

  const quizBlocksWithIds = addIdsToSlides(quizBlocks)
  const { date, title, host } = quizData

  const readyQuiz: QuizData = {
    date,
    title,
    host,
    blocks: quizBlocksWithIds,
  }

  return { questions, updatedJson: readyQuiz }
}

/** Extracts questions from the quiz object and inserts them into the db.
 * After adding slide ids to the object, nserts the quiz to the db. */
export const processAndSaveQuiz = async (
  data: QuizDataRequest,
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

export const updateQuizBlocks = async (id: string, blocks: BlockType) => {
  try {
    const result = await pool.query(
      "UPDATE quiz SET blocks = $1 WHERE id = $2",
      [JSON.stringify(blocks), id],
    )
    return result.rows[0]
  } catch (e) {
    console.error("ERROR updating quiz.", e)
  }
}

export const updateQuizImages = async (params: UpdateQuizImagesRequestType) => {
  const { quizId, slideId, imageId, newData } = params

  try {
    const res = await pool.query("SELECT * FROM quiz WHERE id = $1", [quizId])
    const quiz = res.rows[0]
    if (!quiz) {
      throw new Error(`Quiz with id ${quizId} not found.`)
    }
    if (!imageId) {
      throw new Error("No image id specified.")
    }

    const { blockIndex, slideIndex } = findSlideInBlocks(
      quiz.blocks,
      slideId.toString(),
    )

    const slideObj = quiz.blocks[blockIndex].slides[slideIndex]
    let updatedImages: ImageMeta[]

    if (!slideObj.images) {
      throw new Error("Slide images not found")
    } else {
      updatedImages = slideObj.images.map((img: ImageMeta) =>
        img.id === imageId ? { ...img, ...newData } : img,
      )
    }

    const updatedQuiz = {
      ...quiz,
      blocks: quiz.blocks.map((block: BlockType, bIdx: number) =>
        bIdx === blockIndex
          ? {
              ...block,
              slides: block.slides.map((slide, sIdx) =>
                sIdx === slideIndex
                  ? { ...slide, images: updatedImages }
                  : slide,
              ),
            }
          : block,
      ),
    }

    const updateRes = await updateQuizBlocks(quizId, updatedQuiz.blocks)
    return updateRes
  } catch (e) {
    console.log("ERROR updating quiz with images", e)
  }
}