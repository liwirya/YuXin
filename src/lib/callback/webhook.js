import crypto from "crypto";
import { DIGI_API_KEY } from "#utils/digiflazz/flazz.js";

// Inisialisasi penyimpanan sementara hasil transaksi
// Format: { [ref_id]: { m: objectPesan, timestamp: Date } }
if (!global.ResponseTemp) {
    global.ResponseTemp = {};
}

function isValidSignature(xHubSignature, rawBody) {
    if (!xHubSignature) {
        console.warn("[Webhook] Header X-Hub-Signature tidak ada");
        return false;
    }

    const [algo, signed] = xHubSignature.split("=");

    if (algo !== "sha1") {
        console.warn(`[Webhook] Algoritma tidak didukung: ${algo}`);
        return false;
    }

    const computed = crypto
    .createHmac("sha1", process.env.DIGI_SECRET)
    .update(rawBody)
    .digest("hex");

    return computed === signed;
}

/**
 * Proses data transaksi dari Digiflazz dan kirim balik ke user WA.
 *
 * @param {object} sock - Baileys socket (koneksi WA)
 * @param {object} data - Payload data dari Digiflazz
 */
async function handleTransactionCallback(sock, data) {
    const {
        ref_id,
        customer_no,
        buyer_sku_code,
        message,
        status,
        rc,
        buyer_last_saldo,
        sn,
        price,
        tele,
        wa,
    } = data;

    console.log(`[Webhook] Menerima callback → ref_id: ${ref_id} | status: ${status}`);

    const stored = global.ResponseTemp[ref_id];
    if (!stored) {
        console.warn(`[Webhook] ref_id ${ref_id} tidak ditemukan di ResponseTemp, diabaikan`);
        return;
    }

    const { m } = stored;

    let balasan = "";

    if (status === "Sukses") {
        balasan =
            `✅ *Transaksi Berhasil*\n\n` +
            `• Ref ID      : ${ref_id}\n` +
            `• Produk      : ${buyer_sku_code}\n` +
            `• Nomor       : ${customer_no}\n` +
            `• Harga       : Rp ${price?.toLocaleString("id-ID")}\n` +
            `• Serial No   : ${sn || "-"}\n` +
            `• RC          : ${rc}\n\n` +
            `_Terima kasih telah bertransaksi!_`;

        delete global.ResponseTemp[ref_id];
        console.log(`[Webhook] Transaksi ${ref_id} SUKSES → dihapus dari ResponseTemp`);

    } else if (status === "Gagal") {
        balasan =
            `❌ *Transaksi Gagal*\n\n` +
            `• Ref ID      : ${ref_id}\n` +
            `• Produk      : ${buyer_sku_code}\n` +
            `• Nomor       : ${customer_no}\n` +
            `• Harga       : Rp ${price?.toLocaleString("id-ID")}\n` +
            `• Keterangan  : ${message || "-"}\n` +
            `• RC          : ${rc}\n\n` +
            `_Silakan hubungi admin jika butuh bantuan._`;

        delete global.ResponseTemp[ref_id];
        console.log(`[Webhook] Transaksi ${ref_id} GAGAL → dihapus dari ResponseTemp`);

    } else if (status === "Pending") {
        balasan =
            `⏳ *Transaksi Pending*\n\n` +
            `• Ref ID      : ${ref_id}\n` +
            `• Produk      : ${buyer_sku_code}\n` +
            `• Nomor       : ${customer_no}\n` +
            `• Harga       : Rp ${price?.toLocaleString("id-ID")}\n` +
            `• Keterangan  : ${message || "Sedang diproses"}\n\n` +
            `_Mohon tunggu, transaksi masih diproses oleh provider._`;

        console.log(`[Webhook] Transaksi ${ref_id} PENDING → tetap di ResponseTemp`);

    } else {
        balasan =
            `⚠️ *Status Transaksi: ${status}*\n\n` +
            `• Ref ID      : ${ref_id}\n` +
            `• Keterangan  : ${message || "-"}`;

        console.warn(`[Webhook] Status tidak dikenal: ${status} untuk ref_id ${ref_id}`);
    }

    try {
        await sock.sendMessage(m.from, {
            text: balasan,
        }, { quoted: m });
        console.log(`[Webhook] Balasan terkirim ke ${m.from} untuk ref_id ${ref_id}`);
    } catch (err) {
        console.error(`[Webhook] Gagal kirim pesan ke ${m.from}:`, err.message);
    }
}

function handlePingEvent(body) {
    console.log("[Webhook] Menerima ping event dari Digiflazz");
    console.log(`[Webhook] Hook ID : ${body.hook_id || "-"}`);
    console.log(`[Webhook] SED     : ${body.sed || "-"}`);
}

export async function startWebhookServer(sock) {
    const { createServer } = await import("http");
    const PORT = parseInt(process.env.WEBHOOK_PORT || "3000", 10);

    const server = createServer((req, res) => {
        if (req.method !== "POST" || req.url !== "/webhookdigi") {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found");
            return;
        }

        let rawBody = "";
        req.on("data", (chunk) => {
            rawBody += chunk.toString();
        });

        req.on("end", async () => {
            try {
                const xHubSignature = req.headers["x-hub-signature"];
                const xDigiEvent   = req.headers["x-digiflazz-event"];
                const userAgent    = req.headers["user-agent"] || "";

                console.log(`[Webhook] Request masuk → event: ${xDigiEvent} | agent: ${userAgent}`);

                if (xDigiEvent === "ping" || (!xDigiEvent && rawBody.includes("hook_id"))) {
                    const body = JSON.parse(rawBody);
                    handlePingEvent(body);
                    res.writeHead(200, { "Content-Type": "text/plain" });
                    res.end("OK");
                    return;
                }

                if (!isValidSignature(xHubSignature, rawBody)) {
                    console.error("[Webhook] Signature tidak valid, request ditolak");
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    res.end("Invalid signature");
                    return;
                }

                const parsed = JSON.parse(rawBody);
                const data = parsed?.data;

                if (!data) {
                    console.warn("[Webhook] Payload tidak memiliki field 'data'");
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    res.end("Bad payload");
                    return;
                }

                const isPascabayar = userAgent.includes("Pasca");
                console.log(`[Webhook] Jenis transaksi: ${isPascabayar ? "PASCABAYAR" : "PRABAYAR"}`);

                await handleTransactionCallback(sock, data);

                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end("OK");

            } catch (err) {
                console.error("[Webhook] Error memproses request:", err.message);
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Internal Server Error");
            }
        });
    });

    server.listen(PORT, () => {
        console.log(`[Webhook] Server berjalan di port ${PORT}`);
        console.log(`[Webhook] Endpoint aktif: POST http://localhost:${PORT}/webhookdigi`);
        console.log(`[Webhook] Daftarkan URL ini di dashboard Digiflazz → Atur Koneksi > API > Webhook`);
    });

    return server;
}