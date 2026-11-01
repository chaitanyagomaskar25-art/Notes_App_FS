import jwt from "jsonwebtoken";
import { RefreshToken } from "../model/refreshTokenMode.js";

export const refreshTokenAccess = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({
        status: "failed",
        message: "Refresh token missing. Please log in again.",
      });
    }

    const decode = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN,
    );

    const userRefreshToken = await RefreshToken.findOne({
      token: refreshToken,
      user: decode.userId,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!userRefreshToken) {
      return res.status(401).json({
        status: "failed",
        message: "Refresh token is invalid or revoked. Please log in again.",
      });
    }

    // Revoke the old refresh token (rotation)
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { revoked: true },
    );

    // Generate new access token (15 minutes)
    const newAccessToken = jwt.sign(
      { userId: decode.userId },
      process.env.ACCESS_TOKEN,
      { expiresIn: "15m" },
    );

    // Generate new refresh token (7 days) - rotation
    const newRefreshToken = jwt.sign(
      { userId: decode.userId },
      process.env.REFRESH_TOKEN,
      { expiresIn: "7d" },
    );

    // Save new refresh token to database
    await RefreshToken.create({
      token: newRefreshToken,
      user: decode.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Set new access token cookie
    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    // Set new refresh token cookie
    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      status: "success",
      message: "Access token refreshed successfully.",
    });
  } catch (error) {
    return res.status(401).json({
      status: "failed",
      message: "Refresh token is invalid or expired. Please log in again.",
    });
  }
};
