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
  images?: { [imageIndex: number]: string }
  background?: string
  textColour?: string
}

export interface QuestionSlideType extends BaseSlideType, QuestionDataType {}

export interface TitleSlideType extends BaseSlideType {
  title: string
  subTitle?: string
  superTitle?: string
  text?: string
  cornerElement?: string
}

export type SlideType = QuestionSlideType | TitleSlideType

export interface BlockType {
  type: QuestionType | "static"
  topic?: string
  background?: string
  textColour?: string
  blockAnswer?: string
  slides?: SlideType[]
  parts?: { [points: string]: string }
  blockNumbers?: number[]
}

export interface QuizData {
  id?: number
  date: string
  title: string
  host: string
  blocks: BlockType[]
}
