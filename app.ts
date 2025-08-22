import cors from "cors"
import http from "http"
import { routes } from "./routes"
import express, { Express, type Request, type Response } from "express"

const port = process.env.PORT || 3000
const app: Express = express()
const httpServer = http.createServer(app)

const corsOptions = {
  origin: "http://localhost:5173",
}

app.use(express.json())
app.use(cors(corsOptions))
app.use(express.urlencoded({ extended: false }))

routes(app)

httpServer.listen(port, () => console.log(`listening on port ${port}`))

app.use("/", (req: Request, res: Response) => {
  res.status(400).send({ data: "hello world" })
})
