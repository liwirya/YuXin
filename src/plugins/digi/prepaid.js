import {
    getPrepaidList,
    getCategories,
    getBrandsByCategory,
    getProductsByBrand,
} from "#lib/maketrx/pricelist";

export default {
    name: "prepaid",
    description: "Lihat daftar harga produk prabayar.",
    command: ["prepaid", "prabayar"],
    permissions: "all",
    hidden: false,
    failed: "Gagal menjalankan %command: %error",
    category: "digi",
    cooldown: 5,
    usage: "$prefix$command [category] [brand]",
    react: true,
    wait: null,
    owner: false,
    group: false,
    private: false,
    botAdmin: false,

    execute: async (m, { args }) => {
        try {
            const data = await getPrepaidList();

            // ── Tidak ada argumen → tampilkan semua category ──
            if (args.length === 0) {
                const categories = getCategories(data);

                let text = `🛍️ *Daftar Kategori Prabayar*\n`;
                text += `${"─".repeat(30)}\n\n`;

                categories.forEach((cat, i) => {
                    text += `${i + 1}. ${cat}\n`;
                });

                text += `\n${"─".repeat(30)}\n`;
                text += `_Ketik *${m.prefix}prepaid <kategori>* untuk lihat brand_\n`;
                text += `_Contoh: *${m.prefix}prepaid Pulsa*_`;

                return m.reply(text);
            }

            const categoryArg = args[0];

            // ── 1 argumen → tampilkan brand dalam category ──
            if (args.length === 1) {
                const brands = getBrandsByCategory(data, categoryArg);

                if (brands.length === 0) {
                    return m.reply(
                        `❌ Kategori *${categoryArg}* tidak ditemukan.\n\n` +
                        `Ketik *${m.prefix}prepaid* untuk lihat semua kategori.`
                    );
                }

                let text = `🏷️ *Brand dalam Kategori: ${categoryArg}*\n`;
                text += `${"─".repeat(30)}\n\n`;

                brands.forEach((brand, i) => {
                    text += `${i + 1}. ${brand}\n`;
                });

                text += `\n${"─".repeat(30)}\n`;
                text += `_Ketik *${m.prefix}prepaid ${categoryArg} <brand>* untuk lihat produk_\n`;
                text += `_Contoh: *${m.prefix}prepaid ${categoryArg} ${brands[0]}*_`;

                return m.reply(text);
            }

            // ── 2+ argumen → tampilkan produk berdasar category + brand ──
            const brandArg = args.slice(1).join(" ");
            const products = getProductsByBrand(data, categoryArg, brandArg);

            if (products.length === 0) {
                return m.reply(
                    `❌ Tidak ada produk aktif untuk:\n` +
                    `• Kategori : *${categoryArg}*\n` +
                    `• Brand    : *${brandArg}*\n\n` +
                    `Ketik *${m.prefix}prepaid ${categoryArg}* untuk lihat brand lain.`
                );
            }

            let text = `📦 *${brandArg.toUpperCase()} — ${categoryArg}*\n`;
            text += `${"─".repeat(30)}\n\n`;

            for (const p of products) {
                const stok = p.unlimited_stock
                    ? "∞ Unlimited"
                    : `${p.stock} pcs`;
                const cutoff =
                    p.start_cut_off !== "00:00" || p.end_cut_off !== "00:00"
                        ? `   ⏰ Cut off : ${p.start_cut_off}–${p.end_cut_off}\n`
                        : "";
                const multi = p.multi ? "✅ Multi" : "❌ Single";

                text +=
                    `🔹 *${p.product_name}*\n` +
                    `   SKU    : \`${p.buyer_sku_code}\`\n` +
                    `   Harga  : *Rp ${p.price.toLocaleString("id-ID")}*\n` +
                    `   Stok   : ${stok}\n` +
                    `   ${multi}\n` +
                    cutoff +
                    (p.desc && p.desc !== "-" ? `   📝 ${p.desc}\n` : "") +
                    `\n`;
            }

            text += `${"─".repeat(30)}\n`;
            text += `_Total: ${products.length} produk aktif_\n`;
            text += `_Data diperbarui otomatis tiap 15 menit_`;

            return m.reply(text);

        } catch (error) {
            console.error("[Prepaid] Error:", error);
            return m.reply(
                `❌ *Gagal mengambil daftar harga*\n\n` +
                `• Error: ${error?.response?.data?.rc || error.message || "Tidak diketahui"}`
            );
        }
    },
};