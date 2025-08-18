import { Pool } from "pg"

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "agnes",
  password: "password123",
  database: "quiqz-db",
})

export default pool
