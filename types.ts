const QuestionType = {
  WARM_UP: "warm up",
  THEMATIC: "thematic",
  CONNECTION: "connection",
  IMAGES: "images",
  WHO_AM_I: "who am i",
  PICK_ONE: "pick one",
  MINEFIELD: "minefield",
  SOUNDS: "sounds",
  PLUS_TEN: "plus ten",
} as const

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType]

export interface QuestionDataType {
  question: string
  answer: string
  difficulty?: "easy" | "medium" | "hard" | null
  tags?: string[]
}

export interface TitleSlideType {
  type?: string
  text: string
  subText?: string
  withImage?: boolean
  imageCount?: number
}

export interface QuestionSlideType extends TitleSlideType, QuestionDataType {
  number?: number
  questionType: QuestionType
  background?: string
  textColour?: string
}

export type SlideType = TitleSlideType | QuestionSlideType

export interface BlockType {
  type: QuestionSlideType | "static"
  topic?: string
  slides: SlideType[]
  background?: string
  textColour?: string
}

export interface QuizData {
  id: number
  date: string
  title: string
  blocks: BlockType[]
}
