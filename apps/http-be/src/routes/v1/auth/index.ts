import express from "express";
import passport from "../../../config/passport-config";
import {
  registerUser,
  localLoginSuccess,
  googleCallbackSuccess,
  logout,
  issueTokens,
  refreshToken,
} from "../../../controller/auth/authController";

const router = express.Router();

router.post("/register", registerUser);
router.post(
  "/login",
  passport.authenticate("local", { failureMessage: true }),
  localLoginSuccess
);

/* -------------
   Google OAuth
   -------------
*/
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/login" }),
  googleCallbackSuccess
);

/* -------------
   Logout
   -------------
*/
router.post("/logout", logout);

// Exchange session for JWT + refresh
router.post("/issue-tokens", issueTokens);

// Refresh tokens
router.post("/refresh", refreshToken);


export default router;