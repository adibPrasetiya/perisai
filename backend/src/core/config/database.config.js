import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import {
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
  DATABASE_PASSWORD,
  DATABASE_USER,
} from "./constant.config.js";

export const adapter = new PrismaMariaDb({
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  connectionLimit: 5,
  acquireTimeout: 10000,
  connectTimeout: 10000,
  allowPublicKeyRetrieval: true,
  ssl: false,
});
