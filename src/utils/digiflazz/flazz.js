const isDevelopment = process.env.NODE_ENV === "development";

export const DIGI_BASE_URL = process.env.DIGI_URL;

// API Key Digiflazz
// Development : pakai DIGI_APIKEY_DEV (untuk sandbox/testing)
// Production  : pakai DIGI_APIKEY (untuk transaksi nyata)
export const DIGI_API_KEY = isDevelopment
    ? process.env.DIGI_APIKEY_DEV
    : process.env.DIGI_APIKEY;

export const DIGI_USERNAME = process.env.DIGI_USERNAME;

console.log(
    `[Digiflazz] Berjalan dalam mode ${isDevelopment ? "DEVELOPMENT (sandbox)" : "PRODUCTION (live)"}`
);
console.log(
    `[Digiflazz] Username  : ${DIGI_USERNAME ?? "⚠️ belum diisi di .env"}`
);
console.log(
    `[Digiflazz] Base URL  : ${DIGI_BASE_URL ?? "⚠️ belum diisi di .env"}`
);
console.log(
    `[Digiflazz] API Key   : ${DIGI_API_KEY ? DIGI_API_KEY.substring(0, 10) + "..." : "⚠️ belum diisi di .env"}`
);