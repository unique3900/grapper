import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import dayjs from "dayjs";
const prisma = new PrismaClient();
export const registerUser = async (req: any, res: any) => {
  try {
    const { email, password, name } = req.body;

    const userExist = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        provider: "LOCAL",
        verified: true, //for now we are assuming that all users are verified
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Local login success handler (session-based).
 * - If passport.authenticate('local') is successful, user is attached to req.user
 * - Then req.login() sets up session
 */
export const localLoginSuccess = (req: any, res: any) => {
  try {
    return res.json({
      message: "Logged in successfully",
      user: {
        id: req.user.id,
        email: req.user.email,
        provider: req.user.provider,
      },
      sessionId: req.sessionID,
    });
  } catch (error) {
    console.log("Error in localLoginSuccess: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const googleCallbackSuccess = (req: any, res: any) => {
  return res.json({
    message: "Google login successful",
    user: {
      id: req.user.id,
      email: req.user.email,
      provider: req.user.provider,
    },
    sessionId: req.sessionID,
  });
};

export const logout = (req: any, res: any) => {
  req.logout((err: Error) => {
    console.error("[logout]", err);
    return res.status(500).json({ message: "Internal Server Error" });
  });

  req.session.destroy((err: Error) => {
    console.error("[session-destroy]", err);
    return res.status(500).json({ message: "Internal Server Error" });
  });
};

function generateAccessToken(userId: number) {
  return jwt.sign({ userId }, process.env.JWT_SECRET ?? "", {
    expiresIn: "1h",
  });
}

function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Issue a new JWT + refresh token to the currently logged-in (session) user.
 * - User must already have a valid session
 */
export const issueTokens = async (req: any, res: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not logged in" });
  }
  try {
    const user = req.user;
    const accessToken = generateAccessToken(user.id);

    const refreshToken = generateRefreshToken();
    const expiresAt = dayjs().add(7, "day").toDate();

    // Save to DB
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });

    return res.json({
      message: "Tokens issued",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("[issueTokens]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Refresh token endpoint.
 * - Clients send refreshToken
 * - We validate, rotate, and issue new tokens
 */
export const refreshToken = async (req:any, res:any) => {
  const { refreshToken: incoming } = req.body;

  if (!incoming) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  try {
    const session = await prisma.userSession.findUnique({
      where: { refreshToken: incoming },
      include: { user: true },
    });

    if (!session) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    if (dayjs(session.expiresAt).isBefore(dayjs())) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    // Rotate token
    await prisma.userSession.delete({ where: { refreshToken: incoming } });
    const newRefreshToken = generateRefreshToken();
    const newExpiresAt = dayjs().add(7, "day").toDate();

    await prisma.userSession.create({
      data: {
        userId: session.user.id,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
      },
    });

    // Issue new access token
    const newAccessToken = generateAccessToken(session.user.id);

    return res.json({
      message: "Tokens refreshed",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("[refreshToken]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
