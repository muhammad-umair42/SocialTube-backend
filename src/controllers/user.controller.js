import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "./../models/user.model.js";
import { uploadOnCloudnary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
  //get user details from client
  const { username, email, password, fullName } = req.body;

  //validate user details - not empty
  if (
    [username, email, password, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill all fields");
  }

  //check if user already exists: username, email
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }
  //check for images and avatar
  const avatarLocalFilePath = req.files?.avatar[0].path;
  const coverImageLocalFilePath = req.files?.coverImage[0].path;

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Please upload an avatar");
  }

  //upload them to cloud storage
  const avatar = await uploadOnCloudnary(avatarLocalFilePath);
  const coverImage = null;
  if (coverImageLocalFilePath) {
    coverImage = await uploadOnCloudnary(coverImageLocalFilePath);
  }
  if (!avatar) throw new Error(400, "Avatar is Required");
  //create user object - entry in database
  const user = await User.create({
    username,
    email,
    password,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  //remove password and refresh token from res
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //check for user created
  if (!createdUser) {
    throw new Error(500, "Something went wrong while registering user");
  }
  //return response
  return response
    .status(200)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});
