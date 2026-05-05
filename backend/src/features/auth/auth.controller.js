import authService from "./auth.service.js";
import { extractIpAddress } from "../../utils/device.utils.js";
import { NODE_ENV } from "../../core/config/constant.config.js";

const registration = async (req, res, next) => {
  try {
    const result = await authService.registration(req.body);
    res
      .status(201)
      .json({
        message: result.message,
        data: result.data,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const userAgent = req.headers["user-agent"] || "unknown";
    const ipAddress = extractIpAddress(req);

    const result = await authService.login(req.body, userAgent, ipAddress);

    res
      .status(200)
      .json({
        message: result.message,
        data: result.data,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const verifyLoginTotp = async (req, res, next) => {
  try {
    const userAgent = req.headers["user-agent"] || "unknown";
    const ipAddress = extractIpAddress(req);

    const result = await authService.verifyLoginTotp(
      req.body,
      userAgent,
      ipAddress,
    );

    const { accessTokenExpiryMinutes, sessionExpiryDays } = result.tokenConfig;

    res
      .cookie("accessToken", result.data.accessToken, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: NODE_ENV === "production" ? "strict" : "lax",
        maxAge: accessTokenExpiryMinutes * 60 * 1000,
      })
      .cookie("refreshToken", result.data.refreshToken, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: NODE_ENV === "production" ? "strict" : "lax",
        maxAge: sessionExpiryDays * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        message: result.message,
        data: { user: result.data.user },
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res
      .status(200)
      .json({
        message: result.message,
        data: result.data,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const resetPasswordWithTotp = async (req, res, next) => {
  try {
    const result = await authService.resetPasswordWithTotp(req.body);
    res
      .status(200)
      .json({
        message: result.message,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const initTotpSetup = async (req, res, next) => {
  try {
    const result = await authService.initTotpSetup(req.body);
    res
      .status(200)
      .json({
        message: result.message,
        data: result.data,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const verifyTotpSetup = async (req, res, next) => {
  try {
    const userAgent = req.headers["user-agent"] || "unknown";
    const ipAddress = extractIpAddress(req);

    const result = await authService.verifyTotpSetup(
      req.body,
      userAgent,
      ipAddress,
    );

    const { accessTokenExpiryMinutes, sessionExpiryDays } = result.tokenConfig;

    res
      .cookie("accessToken", result.data.accessToken, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: NODE_ENV === "production" ? "strict" : "lax",
        maxAge: accessTokenExpiryMinutes * 60 * 1000,
      })
      .cookie("refreshToken", result.data.refreshToken, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: NODE_ENV === "production" ? "strict" : "lax",
        maxAge: sessionExpiryDays * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        message: result.message,
        data: { user: result.data.user },
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    const result = await authService.refresh(rawRefreshToken);

    res
      .cookie("accessToken", result.data.accessToken, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: NODE_ENV === "production" ? "strict" : "lax",
        maxAge: result.tokenConfig.accessTokenExpiryMinutes * 60 * 1000,
      })
      .status(200)
      .json({ message: result.message })
      .end();
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const result = await authService.logout(req.user.username);

    const cookieOptions = {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "strict" : "lax",
    };

    res
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .status(200)
      .json({ message: result.message })
      .end();
  } catch (error) {
    next(error);
  }
};

export default {
  registration,
  login,
  verifyLoginTotp,
  forgotPassword,
  resetPasswordWithTotp,
  initTotpSetup,
  verifyTotpSetup,
  refresh,
  logout,
};
