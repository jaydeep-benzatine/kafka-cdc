import express, { type NextFunction, type Request, type Response } from "express";
import morgan from "morgan";
import { dbHealthCheck } from "./db/client";
import apiRoutes from "./routes";

// * INIT
const app = express();
const port = process.env.PORT || 8000;

// * MIDDLEWARES
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// * ROUTES
app.use("/api", apiRoutes);

app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({
    message: "Backend is working fine!",
  });
});

app.get("/health", async (req: Request, res: Response) => {
  const isDBHealthIsFine = await dbHealthCheck();

  return res.status(200).json({
    status: isDBHealthIsFine ? "optimal" : "down",
    uptime: process.uptime().toFixed(2),
    date: new Date(),
  });
});

app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  // Log the error (use your preferred logger)
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);

  const statusCode = res.statusCode ?? 500;

  // Send response
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  });
});

// * SERVER
app.listen(port, () => console.log(`Backend is listening at port:${port}`));
