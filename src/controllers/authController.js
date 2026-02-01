import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import { User } from "../models/user.js";
import { sendEmail } from "../utils/sendMail.js";
import fs from "fs/promises";
import path from "path";
import handlebars from "handlebars";

const templatePath = path.resolve("src/templates/reset-password-email.html");

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: "Password reset email sent successfully" });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const templateSource = await fs.readFile(templatePath, "utf-8");
    const template = handlebars.compile(templateSource);

    const resetLink = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${token}`;

    const html = template({
      name: user.username || user.email,
      link: resetLink,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: "Password reset",
        html,
      });
    } catch (error) {
      throw createHttpError(500, "Failed to send the email, please try again later.");
    }

    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw createHttpError(401, "Invalid or expired token");
    }

    const user = await User.findOne({ _id: payload.sub, email: payload.email });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};