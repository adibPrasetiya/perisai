import assetCategoryController from "./asset-category.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

export const assetCategoryRoutes = [
  {
    method: "post",
    path: "/asset-category",
    handler: assetCategoryController.create,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/asset-category/:assetCategoryId",
    handler: assetCategoryController.update,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/asset-category",
    handler: assetCategoryController.search,
  },
  {
    method: "delete",
    path: "/asset-category/:assetCategoryId",
    handler: assetCategoryController.remove,
    roles: [ROLES.ADMINISTRATOR],
  },
];
