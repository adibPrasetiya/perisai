import userController from "./user.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

export const userRoutes = [
  {
    method: "get",
    path: "/users",
    handler: userController.search,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/users/me",
    handler: userController.getMyProfile,
    // tanpa roles — semua pengguna terautentikasi dapat mengakses
  },
  {
    method: "patch",
    path: "/users/me/password",
    handler: userController.updateMyPassword,
    // tanpa roles — semua pengguna terautentikasi dapat mengakses
  },
  {
    method: "patch",
    path: "/users/me",
    handler: userController.updateMyAccount,
    // tanpa roles — semua pengguna terautentikasi dapat mengakses
  },
  {
    method: "patch",
    path: "/users/me/profile",
    handler: userController.updateMyProfile,
    // tanpa roles — semua pengguna terautentikasi dapat mengakses
  },
  {
    method: "get",
    path: "/users/:userId",
    handler: userController.getById,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/users/:userId",
    handler: userController.adminUpdateUser,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/users/:userId/reset-totp",
    handler: userController.resetTotp,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/users/:userId/verify",
    handler: userController.verify,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/users/:userId/activate",
    handler: userController.activate,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/users/:userId/deactivate",
    handler: userController.deactivate,
    roles: [ROLES.ADMINISTRATOR],
  },
];
