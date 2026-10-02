import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

type RequestLocation = "body" | "query" | "params";

export const validate = (schema: ZodTypeAny, location: RequestLocation = "body") => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[location]);
      if (location === "query") {
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else {
        req[location] = parsed;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
