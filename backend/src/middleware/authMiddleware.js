import jwt from "jsonwebtoken";
import { User } from "../model/userModel.js";

export const verifyAccessToken = async (req, res, next) => {
  try {
const accessToken = req.cookies?.access_token;

    if (!accessToken) {
      return res.status(404).json({
        message: "access token not found",
      });
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);

    const userExist = await User.findById( decoded.userId)

    if(!userExist){
        return res.status(401).json({
        message: "Access token is not valid",
      }); 
    }

    req.user = userExist
    next()

  } catch (error) {
     return res.status(401).json({
      status: "failed",
      message: error.message,
    });
  }
};
