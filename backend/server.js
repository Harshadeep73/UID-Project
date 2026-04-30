require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./db");

const app = express();
app.use(cors({
  origin: "https://harshadeep73.github.io",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200
}));

app.use(express.json());

app.options("/login", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "https://harshadeep73.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

app.options("/signup", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "https://harshadeep73.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("INVALID_INPUT");
  }

  try {
    
    const existing = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.send("USER_EXISTS");
    }

    
    const hashed = await bcrypt.hash(password, 10);

   
    await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2)",
      [email, hashed]
    );

    res.send("SIGNUP_SUCCESS");
  } catch (err) {
    console.error(err);
    res.status(500).send("INTERNAL SERVER ERROR");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("INVALID_INPUT");
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.send("INVALID");
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      res.send("LOGIN_SUCCESS");
    } else {
      res.send("INVALID");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("INTERNAL SERVER ERROR");
  }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});