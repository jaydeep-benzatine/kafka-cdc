import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncReqHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>; // <-- allow any return value

export const asyncHandler =
  (fn: AsyncReqHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
