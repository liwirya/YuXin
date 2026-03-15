import axios from "axios";
import crypto from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
    DIGI_BASE_URL,
    DIGI_API_KEY,
    DIGI_USERNAME,
} from "#utils/digiflazz/flazz";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const CACHE_DIR  = join(__dirname, "../../../sessions");
const CACHE_FILE = join(CACHE_DIR, "pricelist_cache.json");
const CACHE_TTL  = 5 * 60 * 1000; 

if (!global.ResponseTemp) {
    global.ResponseTemp = {};
}

if (!DIGI_BASE_URL || !DIGI_API_KEY || !DIGI_USERNAME) {
    console.error("[TRX] Environment variable Digiflazz tidak lengkap:");
    console.error("[TRX] DIGI_URL     :", DIGI_BASE_URL || "☒ BELUM DIISI");
    console.error("[TRX] DIGI_APIKEY  :", DIGI_API_KEY ? "☑ SET" : "☒ BELUM DIISI");
    console.error("[TRX] DIGI_USERNAME:", DIGI_USERNAME || "☒ BELUM DIISI");
    throw new Error("[TRX] Isi DIGI_URL, DIGI_APIKEY, DIGI_USERNAME di .env");
}

function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

function readCache() {
    try {
        if (!existsSync(CACHE_FILE)) return null;
        const raw  = readFileSync(CACHE_FILE, "utf-8");
        const data = JSON.parse(raw);
        const age  = Date.now() - data.timestamp;
        if (age > CACHE_TTL) {
            console.log("[TRX] Cache pricelist expired, perlu refresh");
            return null;
        }
        console.log(`[TRX] Pakai cache pricelist (umur: ${Math.round(age/1000)}s)`);
        return data.items;
    } catch {
        return null;
    }
}

function writeCache(items) {
    try {
        if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
        writeFileSync(CACHE_FILE, JSON.stringify({
            timestamp: Date.now(),
            items,
        }), "utf-8");
        console.log(`[TRX] Cache pricelist disimpan (${items.length} produk)`);
    } catch (e) {
        console.error("[TRX] Gagal simpan cache:", e.message);
    }
}

export async function getPriceList(cmd = "prepaid", category = null, brand = null, force = false) {
    if (!force) {
        const cached = readCache();
        if (cached) return cached;
    }

    const sign = crypto
        .createHash("md5")
        .update(DIGI_USERNAME + DIGI_API_KEY + "pricelist")
        .digest("hex");

    const payload = {
        cmd,
        username: DIGI_USERNAME,
        sign,
    };

    if (category) payload.category = category;
    if (brand)    payload.brand    = brand;

    console.log(`[TRX] Fetch pricelist dari API → cmd: ${cmd}`);

    const res = await axios.post(`${DIGI_BASE_URL}price-list`, payload, {
        headers: { "Content-Type": "application/json" },
    });

    const items = res.data?.data;

    if (!Array.isArray(items)) {
        console.warn("[TRX] Pricelist response bukan array:", res.data);
        return [];
    }

    writeCache(items);
    return items;
}

export async function getProductPrice(skuCode) {
    const sign = crypto
        .createHash("md5")
        .update(DIGI_USERNAME + DIGI_API_KEY + "pricelist")
        .digest("hex");

    console.log(`[TRX] Cek harga spesifik → SKU: ${skuCode}`);

    const res = await axios.post(`${DIGI_BASE_URL}price-list`, {
        cmd: "prepaid",
        username: DIGI_USERNAME,
        sign,
        code: skuCode, 
    }, {
        headers: { "Content-Type": "application/json" },
    });

    const items = res.data?.data;

    if (!Array.isArray(items) || items.length === 0) {
        console.warn(`[TRX] Produk ${skuCode} tidak ditemukan`);
        return null;
    }

    const product = items.find(p => p.buyer_sku_code === skuCode) || items[0];
    console.log(`[TRX] Harga ${skuCode}: ${formatRupiah(product.price)}`);
    return product;
}

export async function createDigiTRX(refId, produk_sku, customer_no, m, maxPrice = null) {
    const sign = crypto
        .createHash("md5")
        .update(DIGI_USERNAME + DIGI_API_KEY + refId)
        .digest("hex");

    const payload = {
        username: DIGI_USERNAME,
        buyer_sku_code: produk_sku,
        ref_id: refId,
        customer_no: customer_no,
        sign,
        testing: process.env.NODE_ENV === "development",
        cb_url: `http://umakk.cherryyume.biz.id:2000/webhookdigi`,
    };

    if (maxPrice) {
        payload.max_price = maxPrice;
        console.log(`[TRX] max_price diset: ${formatRupiah(maxPrice)}`);
    }

    console.log(`[TRX] Transaksi → ref: ${refId} | sku: ${produk_sku} | no: ${customer_no}`);

    try {
        const res = await axios.post(`${DIGI_BASE_URL}transaction`, payload, {
            headers: { "Content-Type": "application/json" },
        });

        const { ref_id, status, rc, price, sn, buyer_sku_code, message } = res.data.data;

        console.log(`[TRX] Status: ${status} | RC: ${rc}`);

        global.ResponseTemp[refId] = {
            jenis: "Transaksi",
            data: { ref_id: ref_id || refId, status, rc, price, sn, buyer_sku_code, message },
            m,
        };

        return status;

    } catch (error) {
        console.error("[TRX] Error transaksi:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
}

export async function createDeposit(amount, bankName = "BRI", ownerName = DIGI_USERNAME) {
    const sign = crypto
        .createHash("md5")
        .update(DIGI_USERNAME + DIGI_API_KEY + "deposit")
        .digest("hex");

    console.log(`[TRX] Request deposit → ${formatRupiah(amount)} via ${bankName}`);

    try {
        const res = await axios.post(`${DIGI_BASE_URL}deposit`, {
            username: DIGI_USERNAME,
            amount,
            Bank: bankName,
            owner_name: ownerName,
            sign,
        }, {
            headers: { "Content-Type": "application/json" },
        });

        console.log("[TRX] Response deposit:", res.data);
        return res.data;

    } catch (error) {
        console.error("[TRX] Error deposit:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
}

export async function checkSaldo() {
    const sign = crypto
        .createHash("md5")
        .update(DIGI_USERNAME + DIGI_API_KEY + "depo")
        .digest("hex");

    try {
        const res = await axios.post(`${DIGI_BASE_URL}cek-saldo`, {
            username: DIGI_USERNAME,
            sign,
        }, {
            headers: { "Content-Type": "application/json" },
        });

        const depositAmount = parseInt(res.data.data.deposit, 10);
        const saldo = formatRupiah(depositAmount);
        console.log(`[TRX] Saldo: ${saldo}`);
        return saldo;

    } catch (error) {
        console.error("[TRX] Error cek saldo:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
}

export async function createDeposit(amount, bankName, ownerName = DIGI_USERNAME) {
    const bankPerorangan  = ["FLIP", "SHOPEEPAY"];
    const bankPerusahaan  = ["BCA", "MANDIRI", "BRI", "BNI"];
    const bankValid       = [...bankPerorangan, ...bankPerusahaan];

    if (!bankValid.includes(bankName?.toUpperCase())) {
        throw new Error(
            `Bank tidak valid. Pilihan: ${bankValid.join(", ")}`
        );
    }

    const sign = crypto
        .createHash("md5")
        .update(DIGI_USERNAME + DIGI_API_KEY + "deposit")
        .digest("hex");

    console.log(`[TRX] Request deposit → ${formatRupiah(amount)} via ${bankName}`);

    try {
        const res = await axios.post(`${DIGI_BASE_URL}deposit`, {
            username:   DIGI_USERNAME,
            amount:     amount,
            Bank:       bankName.toUpperCase(),
            owner_name: ownerName,
            sign:       sign,
        }, {
            headers: { "Content-Type": "application/json" },
        });

        console.log("[TRX] Response deposit:", res.data);
        return res.data;

    } catch (error) {
        console.error("[TRX] Error deposit:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
}