import express from "express";
import { connectDB } from "./src/config/db.js";
import 'dotenv/config'
import { authRouter } from "./src/routes/authRoute.js";
import { notesRouter } from "./src/routes/notesRoute.js";
import { folderRouter } from "./src/routes/folderRoute.js";
import { shareRouter } from "./src/routes/shareRoute.js";
import { aiRouter } from "./src/routes/aiRoute.js";
import { snippetRouter } from "./src/routes/snippetRoute.js";

import { activityRouter } from "./src/routes/activityRoute.js";
import cors from 'cors'
import cookieParser from "cookie-parser";
import { notFound, errorHandler } from "./src/middleware/errorMiddleware.js";

const app = express()
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}))

app.use(express.json())
app.use(cookieParser())

app.get("/", (req, res)=>{
    res.json({
        message : "Searver is running"
    })
})

app.use("/api/auth", authRouter)
app.use("/api/notes", notesRouter)
app.use("/api/folders", folderRouter)
app.use("/api", shareRouter)
app.use("/api/ai", aiRouter)
app.use("/api/snippets", snippetRouter)
app.use("/api/activity", activityRouter)

connectDB()

app.use(notFound)
app.use(errorHandler)

app.listen(3000, ()=>{
    console.log("Server is running....!!!")
})

