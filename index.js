import express, { json } from "express";
import { MongoClient } from "mongodb";
import { hash } from "bcryptjs";
import { config } from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import multer from "multer";
config();
const app = express();
const upload = multer();
app.use(json());
app.use(cors());
const client = new MongoClient(process.env.MONGO_URI);
let db;

const connectDB = async () => {
  await client.connect();
  db = client.db("userDatabase");
  console.log("MongoDB Connected");
};

connectDB();

// Registration Route
app.post("/register", upload.none(), async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await db.collection("users").findOne({ email });
  if (user) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await hash(password, 10);
  await db
    .collection("users")
    .insertOne({ fullName, email, phone, password: hashedPassword });

  res.status(201).json({ message: "User registered successfully" });
});

// Login Route
app.post("/login", upload.none(), async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await db.collection("users").findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(400).json({ message: "Invalid Email or Password" });

  res.json({ message: "Login successful" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
