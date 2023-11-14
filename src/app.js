const express = require("express")
const cors = require("cors")
const app = express()
const router = express.Router()
app.use(cors())
app.use(express.json())
app.use("/api", router)
const port = process.env.PORT || 3000

const {Pool} = require("pg")
const connectionString = process.env.DB_CONNECTION_STRING || "postgres://postgres:postgres@localhost:5432/postgres"
const pool = new Pool({
  connectionString,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

const {v4: uuidv4} = require("uuid")

// CREATE
router.post("/todos", async (req, res) => {
  try {
    const {todo} = req.body
    const newTodo = await pool.query(
      "INSERT INTO todos(id, description) VALUES($1, $2) RETURNING *", [uuidv4(), todo],
    )
    res.status(201).json(newTodo.rows[0])
  } catch (err) {
    console.error(err.message)
  }
})

// READ
router.get("/todos", async (req, res) => {
  try {
    const allTodos = await pool.query("SELECT * FROM todos")
    res.json(allTodos.rows)
  } catch (err) {
    console.error(err.message)
  }
})

// UPDATE
router.put("/todos/:id", async (req, res) => {
  try {
    const {id} = req.params
    const {todo} = req.body
    const updateTodo = await pool.query(
      "UPDATE todos SET description = $1 WHERE id = $2", [todo, id],
    )
    res.json({id, todo})
  } catch (err) {
    console.error(err.message)
  }
})

// DELETE
router.delete("/todos/:id", async (req, res) => {
  try {
    const {id} = req.params
    await pool.query("DELETE FROM todos WHERE id = $1", [id])
    res.status(204).end()
  } catch (err) {
    console.error(err.message)
  }
})

const initDbWithRetry = async (retriesLeft = 5) => {
  if (retriesLeft <= 0) {
    console.error("ERROR! Failed to connect to DB, exiting")
    process.exit(1)
  }
  let client
  try {
    client = await pool.connect()
    await client.query(`
        CREATE TABLE IF NOT EXISTS todos
        (
            id UUID PRIMARY KEY,
            description TEXT NOT NULL
        );
    `)
    console.log("todos table successfully created")
  } catch (error) {
    console.log(`ERROR! Failed to connect to DB, retrying in 5 seconds (try ${6 - retriesLeft}/5)\n`, error)
    setTimeout(() => initDbWithRetry(retriesLeft - 1), 5000);
  } finally {
    client && client.release()
  }
}

initDbWithRetry()

app.listen(port, async () => {
  console.log("Server has started on port 3000")
})