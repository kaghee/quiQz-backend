export type QuestionType =
  | "Bemelegítés"
  | "Tematikus"
  | "Kapcsolat kör"
  | "A hét kedvence"
  | "Kérdezz! Felelek"
  | "Válassz egyet!"
  | "Aknamező"
  | "Hangos kör"
  | "+10"

export interface QuestionDataType {
  question: string[]
  answer: string
  difficulty?: "easy" | "medium" | "hard" | null
  tags?: string[]
}

export type ImageMeta = {
  id: string // uuid
  url: string
  index: number
  type: "question" | "answer"
  isFullScreen: boolean
}

export const baseImage: ImageMeta = {
  id: "",
  url: "",
  index: 0,
  type: "question",
  isFullScreen: false,
}

export type CachedImagesType = {
  [slideId: number]: ImageMeta[]
}

export interface BaseSlideType {
  id: number
  type: string
  images?: ImageMeta[]
  background?: string
  textColour?: string
  cornerElement?: string
}

export interface QuestionSlideType extends BaseSlideType, QuestionDataType {
  questionTitle?: string
}

export interface TitleSlideType extends BaseSlideType {
  title: string
  superTitle?: string
  text?: string
  checking?: "on" | "off"
}

export type SlideType = QuestionSlideType | TitleSlideType

export interface BlockType {
  type: QuestionType | "static"
  slides: SlideType[]
  topic?: string
  background?: string
  textColour?: string
  blockAnswer?: string
  blockQuestion?: string[]
}

interface BaseQuizDataType {
  id?: number
  date: string
  title: string
  host: string
}

export interface QuizDataRequest extends BaseQuizDataType {
  firstHalf: {
    blocks: BlockType[]
  }
  secondHalf: {
    blocks: BlockType[]
  }
}

export interface QuizData extends BaseQuizDataType {
  blocks: BlockType[]
}

export interface UpdateQuizImagesRequestType {
  quizId: string
  slideId: number
  imageId: string
  newData: Partial<ImageMeta>
}