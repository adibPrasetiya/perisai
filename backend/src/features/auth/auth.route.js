import authController from "./auth.controller.js";

export const authProtectedRoutes = [
  {
    method: "post",
    path: "/auth/logout",
    handler: authController.logout,
  },
];

export const authRoutes = [
  {
    method: "post",
    path: "/users",
    handler: authController.registration,
  },
  {
    method: "post",
    path: "/auth/refresh",
    handler: authController.refresh,
  },
  {
    method: "post",
    path: "/auth/login",
    handler: authController.login,
  },
  {
    method: "post",
    path: "/auth/totp/verify",
    handler: authController.verifyLoginTotp,
  },
  {
    method: "post",
    path: "/auth/totp/setup/init",
    handler: authController.initTotpSetup,
  },
  {
    method: "post",
    path: "/auth/totp/setup/verify",
    handler: authController.verifyTotpSetup,
  },
  {
    method: "post",
    path: "/auth/forgot-password",
    handler: authController.forgotPassword,
  },
  {
    method: "post",
    path: "/auth/forgot-password/verify",
    handler: authController.resetPasswordWithTotp,
  },
];
