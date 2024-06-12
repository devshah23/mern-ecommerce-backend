import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/utility-class.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode ||= 500;
  err.message ||= "Some error occured";
  if (err.name === "CastError") {
    err.message = "Invalid ID";
  }
  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export const TryCatch = (fn: ControllerType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return fn(req, res, next).catch(next);
  };
};
