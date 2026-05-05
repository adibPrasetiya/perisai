import { ALLOWED_ORIGINS } from "./constant.config.js";

const allowedOrigins = (ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const corsOptions = {
  /**
   * Validasi origin secara dinamis.
   *
   * - Jika tidak ada origin header (server-to-server, seperti Next.js proxy ke backend)
   *   → diizinkan tanpa CORS header agar proxy internal tetap berjalan.
   * - Jika origin ada di whitelist → diizinkan.
   * - Selain itu → ditolak dengan error CORS.
   */
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(
      new Error(`Origin '${origin}' tidak diizinkan oleh kebijakan CORS`),
    );
  },

  // Wajib true karena autentikasi menggunakan httpOnly cookie
  credentials: true,

  // Hanya metode yang benar-benar dipakai aplikasi
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],

  // Hanya izinkan header yang diperlukan dari client
  allowedHeaders: ["Content-Type"],

  // Tidak mengekspos header internal ke browser
  exposedHeaders: [],

  // Cache hasil preflight di browser selama 1 jam (kurangi OPTIONS request berulang)
  maxAge: 3600,
};
