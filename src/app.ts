import express, { NextFunction, Request, Response } from "express";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import UserRoute from "./routes/user.js";
import ProductRoute from "./routes/products.js";
import OrderRoute from "./routes/order.js";
import PaymentRoute from "./routes/payment.js";
import DashboardRoute from "./routes/stats.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";
config({
  path: "./.env",
});

const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI || "";
connectDB(mongoURI);
const stripeKey = process.env.STRIPE_KEY || "";
connectDB(mongoURI);
export const stripe = new Stripe(stripeKey);

export const myCache = new NodeCache();
const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

//Routes
app.use("/api/v1/user", UserRoute);
app.use("/api/v1/product", ProductRoute);
app.use("/api/v1/order", OrderRoute);
app.use("/api/v1/payment", PaymentRoute);
app.use("/api/v1/dashboard", DashboardRoute);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
