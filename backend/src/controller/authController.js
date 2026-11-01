import jwt from "jsonwebtoken";
import { User } from "../model/userModel.js";
import bcrypt from "bcrypt";
import { RefreshToken } from "../model/refreshTokenMode.js";

export const registration = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    if (trimmedName.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters." });
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const userExist = await User.findOne({ email: trimmedEmail });
    if (userExist) {
      return res.status(400).json({
        message: "User with this email already exists.",
      });
    }

    const user = User({
      name: trimmedName,
      email: trimmedEmail,
      password,
    });

    await user.save();

    const access_token = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN,
      { expiresIn: "15m" }
    );

    const refresh_token = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN,
      { expiresIn: "7d" }
    );

    await RefreshToken.create({
      token: refresh_token,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully!!",
      data: { name: user.name, email: user.email, _id: user._id },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }
    const trimmedEmail = String(email).trim().toLowerCase();
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const userExist = await User.findOne({ email: trimmedEmail }).select("+password");
    if (!userExist) {
      return res.status(404).json({
        message: "User not found",
      });
    }

const isPasswordCorrect = await bcrypt.compare(
  password,
  userExist.password
);
    if (!isPasswordCorrect) {
  return res.status(401).json({
    message: "Invalid email or password",
  });
}


    const access_token = jwt.sign(
      { userId: userExist._id },
      process.env.ACCESS_TOKEN,
      {
        expiresIn: "15m",
      },
    );

    const refresh_token = jwt.sign(
      { userId: userExist._id },
      process.env.REFRESH_TOKEN,
      {
        expiresIn: "7d",
      },
    );

     await RefreshToken.deleteMany({ user: userExist._id });

    await RefreshToken.create({
      token: refresh_token,
      user: userExist._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });


    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "User Logged In successfully.",
      data: {
        name: userExist.name,
        email: userExist.email,
        _id: userExist._id,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: error.message,
    });
  }
};




export const getMe = async (req, res) => {
  try {
    const user = req.user

    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to verify your session.",
    });
  }
};


export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (refreshToken) {
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { revoked: true },
      );
    }

    res.clearCookie("refresh_token");
    res.clearCookie("access_token")
    res.status(200).json({
      message: "Logout successful",
    });


  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};