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
  question: string
  answer: string
  difficulty?: "easy" | "medium" | "hard" | null
  tags?: string[]
}

export interface BaseSlideType {
  id: number
  type: string
  imageCount?: number
  images?: { [imageIndex: number]: string }
  background?: string
  textColour?: string
}

export interface QuestionSlideType extends BaseSlideType, QuestionDataType {
  number: number
  questionType: QuestionType
  isCheckingMode: boolean
}

export interface TitleSlideType extends BaseSlideType {
  title: string
  subTitle?: string
  superTitle?: string
  text?: string
  cornerText?: string
}

export type SlideType = QuestionSlideType | TitleSlideType

export interface BlockType {
  type: QuestionType | "static"
  topic?: string
  slides: SlideType[]
  background?: string
  textColour?: string
}

export interface QuizData {
  id?: number
  date: string
  title: string
  host: string
  blocks: BlockType[]
}
