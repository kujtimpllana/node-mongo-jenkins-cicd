import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(
    `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@mongodb-service:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin`
  )
  .then(() => console.log("Mongo connected"))
  .catch(console.error);

// User model
const userSchema = new mongoose.Schema({ name: String, email: String });
const User = mongoose.model("User", userSchema);

// CRUD routes
app.get("/users", async (req, res) => res.json(await User.find()));
app.post("/users", async (req, res) => res.json(await User.create(req.body)));
app.put("/users/:id", async (req, res) =>
  res.json(await User.findByIdAndUpdate(req.params.id, req.body, { new: true }))
);
app.delete("/users/:id", async (req, res) =>
  res.json(await User.findByIdAndDelete(req.params.id))
);

app.listen(3000, () => console.log("API running on port 3000"));
