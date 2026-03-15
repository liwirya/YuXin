import axios from "axios";
import crypto from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {
    DIGI_BASE_URL,
    DIGI_API_KEY,
    DIGI_USERNAME,
} from "#utils/digiflazz/flazz";

// ============================================================
// Modul Daftar Harga Digiflazz
// File: src/lib/maketrx/pricelist.js
//
// Data harga disimpan lokal di src/database/pricelist.json
// agar tidak terlalu sering hit API Digiflazz (ada limitasi)
// Cache expired setiap 15 menit sesuai rekomendasi dokumentasi
// ============================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR  = `${__dirname}/../../database`;
const DB_PATH = `${DB_DIR}/pricelist.json`;
const CACHE_MINUTES = 15;

// Pastikan folder database ada
if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
}

// ============================================================
// Helper: baca & tulis database lokal
// ============================================================

function readDB() {
    if (!existsSync(DB_PATH)) return {};
    try {
        return JSON.parse(readFileSync(DB_PATH, "utf-8"));
    } catch {
        return {};
    }
}

function writeDB(data) {
    writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function isCacheValid(timestamp) {
    if (!timestamp) return false;
    const diff = (Date.now() - timestamp) / 1000 / 60; // menit
    return diff < CACHE_MINUTES;
}

// ============================================================
// Fetch dari API Digiflazz
// cmd: "prepaid" atau "pasca"
// filter: { category, brand, type } (opsional, hanya prepaid)
// ============================================================

async function fetchFromAPI(cmd, filter = {}) {
    const sign = crypto
        .createHash("md5")
        .update(DIGI_USERNAME + DIGI_API_KEY + "pricelist")
        .digest("hex");

    const payload = {
        cmd,
        username: DIGI_USERNAME,
        sign,
        ...filter,
    };

    console.log(`[PriceList] Payload:`, JSON.stringify(payload));

    const res = await axios.post(`${DIGI_BASE_URL}price-list`, payload, {
        headers: { "Content-Type": "application/json" },
    });

    // Handle kedua kemungkinan format response
    const result = res.data?.data ?? res.data;

    // Pastikan selalu return array
    if (!Array.isArray(result)) {
        console.error("[PriceList] Response bukan array:", JSON.stringify(result));
        return [];
    }

    console.log(`[PriceList] Berhasil fetch ${result.length} produk`);
    return result;
}

export async function getPrepaidList(filter = {}) {
    const db = readDB();
    const cacheKey = "prepaid";
    const hasFilter = Object.keys(filter).length > 0;

    if (!hasFilter && db[cacheKey] && isCacheValid(db[cacheKey].timestamp)) {
        const cached = db[cacheKey].data;
        // Validasi cache sebelum dipakai
        if (Array.isArray(cached) && cached.length > 0) {
            console.log(`[PriceList] Pakai cache prepaid → ${cached.length} produk`);
            return cached;
        }
        // Cache rusak, hapus dan fetch ulang
        console.warn("[PriceList] Cache rusak, fetch ulang...");
        delete db[cacheKey];
        writeDB(db);
    }

    const data = await fetchFromAPI("prepaid", filter);

    if (!hasFilter && data.length > 0) {
        db[cacheKey] = { timestamp: Date.now(), data };
        writeDB(db);
        console.log(`[PriceList] Cache prepaid diperbarui → ${data.length} produk`);
    }

    return data;
}

export async function getPascaList(filter = {}) {
    const db = readDB();
    const cacheKey = "pasca";
    const hasFilter = Object.keys(filter).length > 0;

    if (!hasFilter && db[cacheKey] && isCacheValid(db[cacheKey].timestamp)) {
        const cached = db[cacheKey].data;
        if (Array.isArray(cached) && cached.length > 0) {
            console.log(`[PriceList] Pakai cache pasca → ${cached.length} produk`);
            return cached;
        }
        console.warn("[PriceList] Cache pasca rusak, fetch ulang...");
        delete db[cacheKey];
        writeDB(db);
    }

    const data = await fetchFromAPI("pasca", filter);

    if (!hasFilter && data.length > 0) {
        db[cacheKey] = { timestamp: Date.now(), data };
        writeDB(db);
        console.log(`[PriceList] Cache pasca diperbarui → ${data.length} produk`);
    }

    return data;
}

// ============================================================
// Helper: ambil daftar category unik dari data
// ============================================================

export function getCategories(data) {
    return [...new Set(data.map((p) => p.category))].sort();
}

// ============================================================
// Helper: ambil daftar brand unik dari category tertentu
// ============================================================

export function getBrandsByCategory(data, category) {
    return [...new Set(
        data
            .filter((p) => p.category.toLowerCase() === category.toLowerCase())
            .map((p) => p.brand)
    )].sort();
}

// ============================================================
// Helper: ambil produk berdasarkan category + brand
// ============================================================

export function getProductsByBrand(data, category, brand) {
    return data.filter(
        (p) =>
            p.category.toLowerCase() === category.toLowerCase() &&
            p.brand.toLowerCase() === brand.toLowerCase() &&
            p.buyer_product_status === true
    );
}