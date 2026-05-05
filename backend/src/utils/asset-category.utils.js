import { prismaClient } from "../core/lib/database.lib.js";
import { NotFoundError } from "../error/not-found.error.js";

/**
 * Verify that the category exists
 */
export const verifyCategoryExists = async (categoryId) => {
  const category = await prismaClient.assetCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new NotFoundError("Kategori aset tidak ditemukan.");
  }

  return category;
};
