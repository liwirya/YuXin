import { checkSaldo } from "#lib/maketrx/trx";

export default {
    name: "saldo",
    description: "Cek saldo deposit Digiflazz.",
    command: ["saldo", "balance"],
    permissions: "all",
    hidden: false,
    failed: "Gagal menjalankan %command: %error",
    category: "digi",
    cooldown: 5,
    usage: "$prefix$command",
    react: true,
    wait: null,
    owner: false,
    group: false,
    private: false,
    botAdmin: false,

    execute: async (m, { sock }) => {
        try {
            console.log("[Saldo] Mengambil saldo Digiflazz...");

            const saldo = await checkSaldo();

            await m.reply(
                `💰 *Saldo Digiflazz*\n\n` +
                `• Saldo saat ini : *${saldo}*\n\n` +
                `_Data diambil langsung dari server Digiflazz._`
            );

        } catch (error) {
            console.error("[Saldo] Error:", error);
            await m.reply(
                `❌ *Cek Saldo Gagal*\n\n` +
                `• Alasan: ${error?.data?.message || error?.message || "Tidak diketahui"}`
            );
        }
    },
};