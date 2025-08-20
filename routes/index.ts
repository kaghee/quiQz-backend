import { type Application, type Router } from "express"
import { QuizRouter } from "./quiz"
import { QuestionRouter } from "./question"
import { ImageRouter } from "./image"

const _routes: Array<[string, Router]> = [
  ["/quiz", QuizRouter],
  ["/question", QuestionRouter],
  ["/image", ImageRouter],
]

export const routes = (app: Application) => {
  _routes.forEach((route) => {
    const [url, router] = route
    app.use(url, router)
  })
}
