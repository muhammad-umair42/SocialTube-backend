import dotenv from "dotenv";
import connectDB from "./database/index.js";
import { app } from "./app.js";

//package configuration
dotenv.config({ path: "/.env" });

//database configuration and app listening
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((error) => {
    console.log("Database connection error: " + error);
  });
