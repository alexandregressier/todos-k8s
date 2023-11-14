const express = require("express")
const cors = require("cors")
const app = express()
const router = express.Router()
app.use(cors())
app.use(express.json())
app.use("/api", router)
const port = process.env.PORT || 3000

const {Pool} = require("pg")
const pool = new Pool({
  connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
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
    res.json(newTodo.rows[0])
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
    res.json("To Do was updated.")
  } catch (err) {
    console.error(err.message)
  }
})

// DELETE
router.delete("/todos/:id", async (req, res) => {
  try {
    const {id} = req.params
    await pool.query("DELETE FROM todos WHERE id = $1", [id])
    res.json("To Do was deleted.")
  } catch (err) {
    console.error(err.message)
  }
})

const initDB = async () => {
  const client = await pool.connect()
  try {
    await client.query(`
        CREATE TABLE IF NOT EXISTS todos
        (
            id UUID PRIMARY KEY,
            description TEXT NOT NULL
        );
    `)
    console.log("todos table successfully created")
  } catch (error) {
    console.error("Error creating table: ", error)
    process.exit(1)
  } finally {
    client.release()
  }
}

initDB()

app.listen(port, async () => {
  console.log("Server has started on port 3000")
})