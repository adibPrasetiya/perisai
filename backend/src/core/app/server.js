import express from "express";
import cors from "cors";
import { corsOptions } from "../config/cors.config.js";
import cookieParser from "cookie-parser";
import { publicRoute } from "../router/public.route.js";
import { authMiddleware } from "../middleware/authetication.middleware.js";
import { protectedRoute } from "../router/protected.route.js";
import { errorMiddleware } from "../middleware/error.middleware.js";

export const app = express();

app.use(cors(corsOptions));
app.use(cookieParser());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(publicRoute);
app.use(authMiddleware);
app.use(protectedRoute);

app.use(errorMiddleware);
