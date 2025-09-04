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

export interface BaseSlideType {
  id: number
  type: string
  images?: { [imageIndex: number]: string }
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
