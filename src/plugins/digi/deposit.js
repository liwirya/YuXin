import { createDeposit } from "#lib/maketrx/trx";

// ============================================================
// Daftar bank yang tersedia sesuai dokumentasi Digiflazz
// ============================================================
const BANK_PERORANGAN  = ["FLIP", "SHOPEEPAY"];
const BANK_PERUSAHAAN  = ["BCA", "MANDIRI", "BRI", "BNI"];
const SEMUA_BANK       = [...BANK_PERORANGAN, ...BANK_PERUSAHAAN];

// Maksimal nominal deposit yang diperbolehkan
const MAX_DEPOSIT = 10000000; // 10 juta
const MIN_DEPOSIT = 1000;     // 10 ribu

export default {
    name: "deposit",
    description: "Request tiket deposit saldo ke Digiflazz.",
    command: ["deposit"],
    permissions: "all",
    hidden: false,
    failed: "Gagal menjalankan %command: %error",
    category: "digi",
    cooldown: 15,
    usage: "$prefix$command <nominal> <bank> <nama_pemilik_rekening>",
    react: true,
    wait: null,
    owner: false,
    group: false,
    private: false,
    botAdmin: false,

    execute: async (m, { args, sock }) => {
        try {
            // ========================================
            // Tidak ada argumen → tampilkan panduan + daftar bank
            // Contoh: .deposit
            // ========================================
            if (args.length === 0) {
                return m.reply(
                    `💳 *Request Deposit Digiflazz*\n\n` +
                    `Format penggunaan:\n` +
                    `\`${m.prefix}deposit <nominal> <bank> <nama>\`\n\n` +
                    `📌 *Contoh:*\n` +
                    `\`${m.prefix}deposit 100000 BRI Huang Li Wen\`\n` +
                    `\`${m.prefix}deposit 50000 FLIP Wira Liwirya\`\n\n` +
                    `🏦 *Pilihan Bank:*\n\n` +
                    `_Perorangan:_\n` +
                    BANK_PERORANGAN.map(b => `• \`${b}\``).join("\n") +
                    `\n\n_Perusahaan:_\n` +
                    BANK_PERUSAHAAN.map(b => `• \`${b}\``).join("\n") +
                    `\n\n📊 *Batas deposit:*\n` +
                    `• Minimal : *Rp ${MIN_DEPOSIT.toLocaleString("id-ID")}*\n` +
                    `• Maksimal: *Rp ${MAX_DEPOSIT.toLocaleString("id-ID")}*`
                );
            }

            // ========================================
            // Parsing argumen: deposit <nominal> <bank> <nama...>
            // ========================================
            const nominal  = parseInt(args[0]);
            const bank     = args[1]?.toUpperCase();
            const namaPemilik = args.slice(2).join(" ").trim();

            // Validasi nominal
            if (isNaN(nominal) || nominal <= 0) {
                return m.reply(
                    `❌ *Nominal tidak valid!*\n\n` +
                    `Masukkan angka yang benar.\n` +
                    `Contoh: \`${m.prefix}deposit 100000 BRI Nama Kamu\``
                );
            }

            if (nominal < MIN_DEPOSIT) {
                return m.reply(
                    `❌ *Nominal terlalu kecil!*\n\n` +
                    `• Nominal kamu  : *Rp ${nominal.toLocaleString("id-ID")}*\n` +
                    `• Minimal deposit: *Rp ${MIN_DEPOSIT.toLocaleString("id-ID")}*`
                );
            }

            if (nominal > MAX_DEPOSIT) {
                return m.reply(
                    `❌ *Nominal melebihi batas!*\n\n` +
                    `• Nominal kamu   : *Rp ${nominal.toLocaleString("id-ID")}*\n` +
                    `• Maksimal deposit: *Rp ${MAX_DEPOSIT.toLocaleString("id-ID")}*`
                );
            }

            // Validasi bank
            if (!bank) {
                return m.reply(
                    `❌ *Bank belum diisi!*\n\n` +
                    `Pilihan bank yang tersedia:\n\n` +
                    `_Perorangan:_ ${BANK_PERORANGAN.join(", ")}\n` +
                    `_Perusahaan:_ ${BANK_PERUSAHAAN.join(", ")}\n\n` +
                    `Contoh: \`${m.prefix}deposit 100000 BRI Nama Kamu\``
                );
            }

            if (!SEMUA_BANK.includes(bank)) {
                return m.reply(
                    `❌ *Bank tidak valid!*\n\n` +
                    `Bank *${bank}* tidak tersedia.\n\n` +
                    `🏦 *Pilihan bank yang valid:*\n\n` +
                    `_Perorangan:_ ${BANK_PERORANGAN.join(", ")}\n` +
                    `_Perusahaan:_ ${BANK_PERUSAHAAN.join(", ")}`
                );
            }

            // Validasi nama pemilik rekening
            if (!namaPemilik || namaPemilik.length < 3) {
                return m.reply(
                    `❌ *Nama pemilik rekening belum diisi!*\n\n` +
                    `Nama pemilik rekening yang melakukan transfer wajib diisi.\n\n` +
                    `Contoh: \`${m.prefix}deposit 100000 ${bank} Nama Lengkap Kamu\``
                );
            }

            // ========================================
            // Kirim request deposit ke Digiflazz
            // ========================================
            console.log(`[Deposit] Request → Rp ${nominal.toLocaleString("id-ID")} | Bank: ${bank} | Nama: ${namaPemilik}`);

            const result = await createDeposit(nominal, bank, namaPemilik);
            const data   = result?.data;

            if (!data) {
                return m.reply(
                    `❌ *Deposit Gagal*\n\n` +
                    `Tidak ada response dari server Digiflazz.\n` +
                    `Coba lagi beberapa saat.`
                );
            }

            // RC 00 = sukses, lainnya = gagal
            if (data.rc !== "00") {
                return m.reply(
                    `❌ *Deposit Ditolak*\n\n` +
                    `• RC      : ${data.rc}\n` +
                    `• Pesan   : ${data.message || "Tidak ada keterangan"}`
                );
            }

            // ========================================
            // Tampilkan informasi tiket deposit
            // ========================================
            const jumlahTransfer = parseInt(data.amount);

            await m.reply(
                `✅ *Tiket Deposit Berhasil Dibuat*\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `🏦 *Informasi Transfer*\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `• Bank            : *${data.bank}*\n` +
                `• Metode          : *${data.payment_method}*\n` +
                `• No. Rekening    : *${data.account_no}*\n` +
                `• Jumlah Transfer : *Rp ${jumlahTransfer.toLocaleString("id-ID")}*\n` +
                `• Berita Transfer : *${data.notes}*\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `⚠️ *Perhatian:*\n` +
                `• Transfer *tepat* sesuai nominal di atas\n` +
                `• Wajib isi berita/keterangan: *${data.notes}*\n` +
                `• Atas nama pengirim: *${namaPemilik}*\n` +
                `• Saldo akan otomatis masuk setelah transfer dikonfirmasi\n` +
                `━━━━━━━━━━━━━━━━━━━━`
            );

        } catch (error) {
            console.error("[Deposit] Error:", error);

            const pesanError = error?.data?.message
                || error?.message
                || "Terjadi kesalahan tidak diketahui";

            await m.reply(
                `❌ *Deposit Gagal*\n\n` +
                `• Alasan: ${pesanError}\n\n` +
                `_Coba lagi atau hubungi admin._`
            );
        }
    },
};