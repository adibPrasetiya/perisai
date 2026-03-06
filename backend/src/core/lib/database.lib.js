import { PrismaClient } from "../../generated/prisma/index.js";
import { adapter } from "../config/database.config.js";

export const prismaClient = new PrismaClient({ adapter });
