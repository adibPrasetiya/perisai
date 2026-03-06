import { validate } from "../../utils/validator.utils.js";
import {
  assetCategoryIdSchema,
  createAssetCategorySchema,
  searchAssetCategorySchema,
  updateAssetCategorySchema,
} from "./asset-category.validation.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { ConflictError } from "../../error/conflict.error.js";
import { NotFoundError } from "../../error/not-found.error.js";

const create = async (reqBody) => {
  reqBody = validate(createAssetCategorySchema, reqBody);

  // Check if name already exists
  const existingName = await prismaClient.assetCategory.findUnique({
    where: {
      name: reqBody.name,
    },
  });

  if (existingName) {
    throw new ConflictError(
      `Nama kategori aset "${reqBody.name}" sudah digunakan.`,
    );
  }

  // Create asset category
  const assetCategory = await prismaClient.assetCategory.create({
    data: {
      name: reqBody.name,
      description: reqBody.description || null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log("ACTION_TYPES.ASSET_CATEGORY_CREATED", {
    assetCategoryId: assetCategory.id,
  });

  return {
    message: "Kategori aset berhasil dibuat",
    data: assetCategory,
  };
};

const update = async (id, reqBody) => {
  const idParams = validate(assetCategoryIdSchema, { id });
  reqBody = validate(updateAssetCategorySchema, reqBody);

  // Check if asset category exists
  const existingCategory = await prismaClient.assetCategory.findUnique({
    where: {
      id: idParams.id,
    },
  });

  if (!existingCategory) {
    throw new NotFoundError("Kategori aset tidak ditemukan.");
  }

  // If name is being updated, check if new name already exists
  if (reqBody.name && reqBody.name !== existingCategory.name) {
    const nameExists = await prismaClient.assetCategory.findUnique({
      where: {
        name: reqBody.name,
      },
    });

    if (nameExists) {
      throw new ConflictError(
        `Nama kategori aset "${reqBody.name}" sudah digunakan oleh kategori lain.`,
      );
    }
  }

  // Update asset category
  const updatedCategory = await prismaClient.assetCategory.update({
    where: {
      id: idParams.id,
    },
    data: reqBody,
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log("ACTION_TYPES.RISK_CATEGORY_UPDATED", {
    assetCategoryId: idParams.id,
    updatedData: reqBody,
  });

  return {
    message: "Kategori aset berhasil diperbarui",
    data: updatedCategory,
  };
};

const search = async (queryParams) => {
  const params = validate(searchAssetCategorySchema, queryParams);
  const { name, page, limit } = params;

  const where = {};

  if (name) {
    where.name = {
      contains: name,
    };
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.assetCategory.count({ where });

  const assetCategories = await prismaClient.assetCategory.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          assets: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Kategori aset berhasil ditemukan",
    data: assetCategories,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const remove = async (id) => {
  const params = validate(assetCategoryIdSchema, { id });

  // Check if asset category exists
  const existingCategory = await prismaClient.assetCategory.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!existingCategory) {
    throw new NotFoundError("Kategori aset tidak ditemukan.");
  }

  // Check if category has associated assets (Restrict constraint)
  const assetCount = await prismaClient.asset.count({
    where: {
      categoryId: params.id,
    },
  });

  if (assetCount > 0) {
    throw new ConflictError(
      `Kategori aset tidak dapat dihapus karena masih memiliki ${assetCount} aset yang terkait. Silakan hapus atau pindahkan aset terlebih dahulu.`,
    );
  }

  // Delete asset category (hard delete)
  await prismaClient.assetCategory.delete({
    where: {
      id: params.id,
    },
  });

  console.log("ACTION_TYPES.RISK_CATEGORY_DELETED", {
    assetCategoryId: params.id,
  });

  return {
    message: "Kategori aset berhasil dihapus",
  };
};

export default { create, update, search, remove };
