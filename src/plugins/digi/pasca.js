import { getPascaList } from "#lib/maketrx/pricelist";

export default {
    name: "pasca",
    description: "Lihat daftar harga produk pascabayar.",
    command: ["pasca", "pascabayar", "postpaid"],
    permissions: "all",
    hidden: false,
    failed: "Gagal menjalankan %command: %error",
    category: "digi",
    cooldown: 5,
    usage: "$prefix$command [brand]",
    react: true,
    wait: null,
    owner: false,
    group: false,
    private: false,
    botAdmin: false,

    execute: async (m, { args }) => {
        try {
            const data = await getPascaList();

            // ── Tidak ada argumen → tampilkan semua brand ──
            if (args.length === 0) {
                const brands = [...new Set(data.map((p) => p.brand))].sort();

                let text = `🧾 *Daftar Brand Pascabayar*\n`;
                text += `${"─".repeat(30)}\n\n`;

                brands.forEach((brand, i) => {
                    text += `${i + 1}. ${brand}\n`;
                });

                text += `\n${"─".repeat(30)}\n`;
                text += `_Ketik *${m.prefix}pasca <brand>* untuk lihat produk_\n`;
                text += `_Contoh: *${m.prefix}pasca PLN*_`;

                return m.reply(text);
            }

            // ── Ada argumen → tampilkan produk brand tersebut ──
            const brandArg = args.join(" ");
            const products = data.filter(
                (p) =>
                    p.brand.toLowerCase() === brandArg.toLowerCase() &&
                    p.buyer_product_status === true
            );

            if (products.length === 0) {
                return m.reply(
                    `❌ Tidak ada produk aktif untuk brand *${brandArg}*\n\n` +
                    `Ketik *${m.prefix}pasca* untuk lihat semua brand.`
                );
            }

            let text = `🧾 *Pascabayar — ${brandArg.toUpperCase()}*\n`;
            text += `${"─".repeat(30)}\n\n`;

            for (const p of products) {
                text +=
                    `🔹 *${p.product_name}*\n` +
                    `   SKU    : \`${p.buyer_sku_code}\`\n` +
                    `   Admin  : *Rp ${p.admin.toLocaleString("id-ID")}*\n` +
                    `   Komisi : Rp ${p.commission.toLocaleString("id-ID")}\n` +
                    (p.desc && p.desc !== "-" ? `   📝 ${p.desc}\n` : "") +
                    `\n`;
            }

            text += `${"─".repeat(30)}\n`;
            text += `_Total: ${products.length} produk aktif_\n`;
            text += `_Data diperbarui otomatis tiap 15 menit_`;

            return m.reply(text);

        } catch (error) {
            console.error("[Pasca] Error:", error);
            return m.reply(
                `❌ *Gagal mengambil daftar harga*\n\n` +
                `• Error: ${error?.response?.data?.rc || error.message || "Tidak diketahui"}`
            );
        }
    },
};
