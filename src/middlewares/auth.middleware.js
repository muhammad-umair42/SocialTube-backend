import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization").replace("Bearer ", "");

    if (!token) {
      throw new ApiError(404, "Auth Token missing");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = User.findById(decoded?._id).select("=passoword -refreshToken");

    if (!user) {
      throw new ApiError(404, "Invalid Access");
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(400, error.message || "Invalid Access Token");
  }
});
