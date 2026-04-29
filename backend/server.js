require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./db");

const app = express();


app.use(cors());
app.use(express.json());



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