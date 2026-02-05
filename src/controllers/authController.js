import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import { User } from "../models/user.js";
import { Session } from "../models/session.js";
import { sendEmail } from "../utils/sendMail.js";
import { createSession, setSessionCookies } from "../services/auth.js";
import fs from "fs/promises";
import path from "path";
import handlebars from "handlebars";

const templatePath = path.resolve("src/templates/reset-password-email.html");

// ==================== AUTH ====================

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createHttpError(400, "Email in use");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });

    const session = await createSession(user._id);
    setSessionCookies(res, session);

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw createHttpError(401, "Email or password is wrong");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw createHttpError(401, "Email or password is wrong");
    }

    // ❗ Удаляем старые сессии пользователя
    await Session.deleteMany({ userId: user._id });

    const session = await createSession(user._id);
    setSessionCookies(res, session);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;
    if (!sessionId) {
      throw createHttpError(401, "Not authorized");
    }

    await Session.findByIdAndDelete(sessionId);

    res.clearCookie("sessionId");
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const refreshUserSession = async (req, res, next) => {
  try {
    const { refreshToken, sessionId } = req.cookies;

    if (!refreshToken || !sessionId) {
      throw createHttpError(401, "Not authorized");
    }

    // ❗ Проверяем срок действия refreshToken
    try {
      jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (error) {
      throw createHttpError(401, "Not authorized");
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      throw createHttpError(401, "Not authorized");
    }

    if (session.refreshToken !== refreshToken) {
      throw createHttpError(401, "Not authorized");
    }

    const newSession = await createSession(session.userId);
    await Session.findByIdAndDelete(sessionId);

    setSessionCookies(res, newSession);

    res.status(200).json({ message: "Session refreshed" });
  } catch (error) {
    next(error);
  }
};

// ==================== PASSWORD RESET ====================

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(200)
        .json({ message: "Password reset email sent successfully" });
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
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: "Password reset",
        html,
      });
    } catch (error) {
      throw createHttpError(
        500,
        "Failed to send the email, please try again later."
      );
    }

    res
      .status(200)
      .json({ message: "Password reset email sent successfully" });
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

    const user = await User.findOne({
      _id: payload.sub,
      email: payload.email,
    });

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