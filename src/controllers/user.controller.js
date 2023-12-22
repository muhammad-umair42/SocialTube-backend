import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
export const registerUser = asyncHandler(async (req, res) => {
  //get user details from client
  const { name, email, password, fullName } = req.body;

  //validate user details - not empty
  if ([name, email, password, fullName].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Please fill all fields");
  }

  //check if user already exists: username, email

  //check for images and avatar
  //upload them to cloud storage
  //create user object - entry in database
  //remove password and refresh token from response
  //check for user created
  //return response
});
