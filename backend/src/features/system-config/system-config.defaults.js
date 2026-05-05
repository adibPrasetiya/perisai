export const SYSTEM_CONFIG_DEFAULTS = [
  // ─── Kebijakan Password ────────────────────────────────────────────────────
  {
    key: "PASSWORD_MAX_AGE_DAYS",
    value: "0",
    dataType: "INTEGER",
    group: "PASSWORD_POLICY",
    label: "Masa Berlaku Password (hari)",
    description:
      "Berapa hari sebelum pengguna harus mengganti password. Isi 0 untuk tidak ada batas.",
    isEditable: true,
  },
  {
    key: "PASSWORD_MIN_LENGTH",
    value: "8",
    dataType: "INTEGER",
    group: "PASSWORD_POLICY",
    label: "Panjang Minimum Password",
    description: "Jumlah karakter minimum yang diperlukan untuk password baru.",
    isEditable: true,
  },
  {
    key: "PASSWORD_REQUIRE_UPPERCASE",
    value: "true",
    dataType: "BOOLEAN",
    group: "PASSWORD_POLICY",
    label: "Wajib Huruf Kapital",
    description: "Password harus mengandung minimal satu huruf kapital (A-Z).",
    isEditable: true,
  },
  {
    key: "PASSWORD_REQUIRE_NUMBER",
    value: "true",
    dataType: "BOOLEAN",
    group: "PASSWORD_POLICY",
    label: "Wajib Angka",
    description: "Password harus mengandung minimal satu angka (0-9).",
    isEditable: true,
  },
  {
    key: "PASSWORD_REQUIRE_SPECIAL_CHAR",
    value: "true",
    dataType: "BOOLEAN",
    group: "PASSWORD_POLICY",
    label: "Wajib Karakter Spesial",
    description:
      "Password harus mengandung minimal satu karakter spesial (mis. @, #, $, !).",
    isEditable: true,
  },

  // ─── Sesi & Token ─────────────────────────────────────────────────────────
  {
    key: "SESSION_EXPIRY_DAYS",
    value: "7",
    dataType: "INTEGER",
    group: "SESSION",
    label: "Masa Aktif Sesi (hari)",
    description:
      "Berapa hari sesi pengguna tetap aktif sebelum harus login ulang.",
    isEditable: true,
  },
  {
    key: "ACCESS_TOKEN_EXPIRY_MINUTES",
    value: "15",
    dataType: "INTEGER",
    group: "SESSION",
    label: "Masa Berlaku Access Token (menit)",
    description:
      "Durasi access token sebelum kedaluwarsa dan perlu diperbarui. Nilai lebih kecil meningkatkan keamanan.",
    isEditable: true,
  },

  // ─── Keamanan ─────────────────────────────────────────────────────────────
  {
    key: "LOGIN_THROTTLE_ENABLED",
    value: "false",
    dataType: "BOOLEAN",
    group: "SECURITY",
    label: "Aktifkan Login Throttling",
    description:
      "Batasi jumlah percobaan login untuk mencegah serangan brute force.",
    isEditable: true,
  },
  {
    key: "LOGIN_MAX_ATTEMPTS",
    value: "5",
    dataType: "INTEGER",
    group: "SECURITY",
    label: "Maks. Percobaan Login",
    description:
      "Jumlah percobaan login gagal sebelum akun dikunci sementara. Hanya berlaku jika Login Throttling aktif.",
    isEditable: true,
  },
  {
    key: "LOGIN_LOCKOUT_DURATION_MINUTES",
    value: "15",
    dataType: "INTEGER",
    group: "SECURITY",
    label: "Durasi Kunci Akun (menit)",
    description:
      "Berapa menit akun dikunci setelah melebihi batas percobaan login. Hanya berlaku jika Login Throttling aktif.",
    isEditable: true,
  },
];
