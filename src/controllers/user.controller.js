import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "./../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(500, "Something went wrong while generating Tokens");
  }
};

//Register User
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
  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  let coverImage = null;
  if (coverImageLocalFilePath) {
    coverImage = await uploadOnCloudinary(coverImageLocalFilePath);
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
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

//Login User
export const loginUser = asyncHandler(async (req, res) => {
  //get request data
  const { username, email, password } = req.body;
  //username or email is required
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }
  //find the user
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  //password check
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }
  //access token and refresh token
  const { accessToken, refreshToken } = generateAccessTokenAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //send cookie
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

//Logout User
export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "User Logged out successfully."));
});
