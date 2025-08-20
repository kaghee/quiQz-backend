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

export interface BaseSlideType {
  type: string
  imageCount?: number
  images?: []
  background?: string
  textColour?: string
}

export interface QuestionSlideType extends BaseSlideType, QuestionDataType {
  number: number
  questionType: QuestionType
  isCheckingMode: boolean
}

export interface TitleSlideType extends BaseSlideType {
  text: string
  subText?: string
}

export type SlideType = QuestionSlideType & TitleSlideType

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
