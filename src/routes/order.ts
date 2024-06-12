import express from "express";

import { adminOnly } from "../middlewares/auth.js";
import {
  allOrders,
  deleteOrder,
  newOrder,
  processOrder,
  singleOrder,
} from "../controllers/order.js";
import { myOrders } from "../controllers/order.js";
const app = express.Router();

app.post("/new", newOrder);

app.get("/my", myOrders);

app.get("/all", adminOnly, allOrders);

app
  .route("/:id")
  .get(singleOrder)
  .put(adminOnly, processOrder)
  .delete(adminOnly, deleteOrder);

export default app;
