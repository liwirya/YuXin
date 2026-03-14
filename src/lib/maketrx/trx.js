import axios from "axios";
import crypto from "crypto";
import {
    DIGI_BASE_URL,
    DIGI_API_KEY,
    DIGI_USERNAME,
} from "#utils/digiflazz/flazz.js";

if (!global.ResponseTemp) {
    global.ResponseTemp = {};
}

if (!DIGI_BASE_URL || !DIGI_API_KEY || !DIGI_USERNAME) {
    console.error("[TRX] Environment variable Digiflazz tidak lengkap:");
    console.error("[TRX] DIGI_URL     :", DIGI_BASE_URL || "❌ BELUM DIISI");
    console.error("[TRX] DIGI_APIKEY  :", DIGI_API_KEY ? "✅ SET" : "❌ BELUM DIISI");
    console.error("[TRX] DIGI_USERNAME:", DIGI_USERNAME || "❌ BELUM DIISI");
    throw new Error("[TRX] Isi DIGI_URL, DIGI_APIKEY, dan DIGI_USERNAME di file .env");
}

function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export async function createDigiTRX(refId, produk_sku, customer_no, m) {
    const sign = crypto
        .createHash("md5")
        .update(DIGI_USERNAME + DIGI_API_KEY + refId)
        .digest("hex");

    try {
        const payload = {
            username: DIGI_USERNAME,
            buyer_sku_code: produk_sku,
            ref_id: refId,
            customer_no: customer_no,
            sign: sign,
            testing: process.env.NODE_ENV === "development",
            cb_url: `http://umakk.cherryyume.biz.id:2000/webhookdigi`,
        };

        console.log(`[TRX] Mengirim transaksi → ref_id: ${refId} | sku: ${produk_sku} | no: ${customer_no}`);

        const res = await axios.post(`${DIGI_BASE_URL}transaction`, payload, {
            headers: { "Content-Type": "application/json" },
        });

        const {
            ref_id,
            status,
            rc,
            price,
            sn,
            buyer_sku_code,
            message,
        } = res.data.data;

        console.log(`[TRX] Response → status: ${status} | rc: ${rc}`);

        global.ResponseTemp[refId] = {
            jenis: "Transaksi",
            data: {
                ref_id: ref_id || refId,
                status,
                rc,
                price,
                sn,
                buyer_sku_code,
                message,
            },
            m,
        };

        return status; // "Pending", "Sukses", atau "Gagal"

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

    try {
        const payload = {
            username: DIGI_USERNAME,
            amount: amount,
            Bank: bankName,
            owner_name: ownerName,
            sign: sign,
        };

        console.log(`[TRX] Request deposit → jumlah: ${formatRupiah(amount)} | bank: ${bankName}`);

        const res = await axios.post(`${DIGI_BASE_URL}deposit`, payload, {
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
        const payload = {
            username: DIGI_USERNAME,
            sign: sign,
        };

        const res = await axios.post(`${DIGI_BASE_URL}cek-saldo`, payload, {
            headers: { "Content-Type": "application/json" },
        });

        const depositAmount = parseInt(res.data.data.deposit, 10);
        const saldo = formatRupiah(depositAmount);

        console.log(`[TRX] Saldo Digiflazz: ${saldo}`);
        return saldo;

    } catch (error) {
        console.error("[TRX] Error cek saldo:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
}

export async function getDaftarHarga(cmd = "prepaid", category = "", brand = "") {
    const sign = crypto
        .createHash("md5")
        .update(DIGI_USERNAME + DIGI_API_KEY + "pricelist")
        .digest("hex");

    try {
        const payload = {
            cmd,
            username: DIGI_USERNAME,
            sign,
            ...(category && { category }),
            ...(brand && { brand }),
        };

        console.log(`[TRX] Mengambil daftar harga → cmd: ${cmd} | category: ${category || "semua"} | brand: ${brand || "semua"}`);

        const res = await axios.post(`${DIGI_BASE_URL}price-list`, payload, {
            headers: { "Content-Type": "application/json" },
        });

        return res.data.data || [];

    } catch (error) {
        console.error("[TRX] Error daftar harga:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
}