import { getPriceList, getProductPrice } from "#lib/maketrx/trx";

export default {
    name: "harga",
    description: "Cek daftar harga produk Digiflazz.",
    command: ["harga", "price", "cekproduk"],
    permissions: "all",
    hidden: false,
    failed: "Gagal menjalankan %command: %error",
    category: "digi",
    cooldown: 10,
    usage: "$prefix$command [kategori|brand|type|sku]",
    react: true,
    wait: null,
    owner: false,
    group: false,
    private: false,
    botAdmin: false,

    execute: async (m, { args, sock }) => {
        try {
            const query = args.join(" ").trim();

            const semuaProduk = await getPriceList("prepaid");

            if (!semuaProduk || semuaProduk.length === 0) {
                return m.reply(
                    `☒ *Gagal ambil data produk*\n\n` +
                    `Produk belum ada atau belum diaktifkan di Digiflazz.\n` +
                    `Aktifkan produk di member.digiflazz.com terlebih dahulu.`
                );
            }

            const produkAktif = semuaProduk.filter(
                p => p.buyer_product_status && p.seller_product_status
            );

            function getUnik(field, filterFn = null) {
                const source = filterFn ? produkAktif.filter(filterFn) : produkAktif;
                return [...new Set(source.map(p => p[field]).filter(Boolean))].sort();
            }

            function cariCocok(list, q) {
                return list.find(x => x.toLowerCase() === q.toLowerCase());
            }

            const kategoriList = getUnik("category");
            const brandList    = getUnik("brand");
            const typeList     = getUnik("type");

            if (!query) {
                let response =
                    `◈ *Daftar Kategori Produk*\n` +
                    `_Total ${kategoriList.length} kategori tersedia_\n\n`;

                for (const kat of kategoriList) {
                    const jumlahBrand   = getUnik("brand",  p => p.category === kat).length;
                    const jumlahProduk  = produkAktif.filter(p => p.category === kat).length;
                    response +=
                        `• *${kat}*\n` +
                        `  ${jumlahBrand} brand · ${jumlahProduk} produk\n` +
                        `  → \`${m.prefix}harga ${kat}\`\n\n`;
                }

                response +=
                    `_Atau langsung cek SKU spesifik:_\n` +
                    `\`${m.prefix}harga <kode_sku>\``;

                return m.reply(response);
            }

            let matchBrandType = null;
            for (let i = 1; i < args.length; i++) {
                const brandPart = args.slice(0, i).join(" ");
                const typePart  = args.slice(i).join(" ");
                const b = cariCocok(brandList, brandPart);
                const t = cariCocok(typeList,  typePart);
                if (b && t) {
                    matchBrandType = { brand: b, type: t };
                    break;
                }
            }

            let matchKategoriBrand = null;
            for (let i = 1; i < args.length; i++) {
                const katPart   = args.slice(0, i).join(" ");
                const brandPart = args.slice(i).join(" ");
                const k = cariCocok(kategoriList, katPart);
                const b = cariCocok(brandList,    brandPart);
                if (k && b) {
                    matchKategoriBrand = { kategori: k, brand: b };
                    break;
                }
            }

            if (matchBrandType) {
                const { brand, type } = matchBrandType;

                const aktif = produkAktif.filter(
                    p => p.brand === brand && p.type === type
                );

                if (aktif.length === 0) {
                    return m.reply(
                        `⚠ *Tidak ada produk aktif*\n\n` +
                        `Brand *${brand}* tipe *${type}* tidak ada produk.\n\n` +
                        `Kembali: \`${m.prefix}harga ${brand}\``
                    );
                }

                const kategoriDari = [...new Set(aktif.map(p => p.category))].join(", ");

                let response =
                    `❒ *${brand} — ${type}*\n` +
                    `_Kategori: ${kategoriDari} · Total ${aktif.length} produk_\n\n`;

                for (const p of aktif) {
                    const stok = p.unlimited_stock ? "∞" : p.stock > 0 ? p.stock : "☒";
                    response +=
                        `• *${p.product_name}*\n` +
                        `  SKU   : \`${p.buyer_sku_code}\`\n` +
                        `  Harga : *Rp ${p.price?.toLocaleString("id-ID")}*\n` +
                        `  Stok  : ${stok}\n\n`;
                }

                response +=
                    `_Detail: \`${m.prefix}harga <kode_sku>\`_\n` +
                    `_Kembali: \`${m.prefix}harga ${brand}\`_`;

                return m.reply(response);
            }

            if (matchKategoriBrand) {
                const { kategori, brand } = matchKategoriBrand;

                const typeListDari = getUnik("type",
                    p => p.category === kategori && p.brand === brand
                );

                if (typeListDari.length === 0) {
                    return m.reply(
                        `⚠ *Tidak ada produk aktif*\n\n` +
                        `Brand *${brand}* di kategori *${kategori}* tidak ada produk.\n\n` +
                        `Kembali: \`${m.prefix}harga ${kategori}\``
                    );
                }

                if (typeListDari.length === 1) {
                    const aktif = produkAktif.filter(
                        p => p.category === kategori && p.brand === brand
                    );

                    let response =
                        `❒ *${brand}*\n` +
                        `_Kategori: ${kategori} · Total ${aktif.length} produk_\n\n`;

                    for (const p of aktif) {
                        const stok = p.unlimited_stock ? "∞" : p.stock > 0 ? p.stock : "☒";
                        response +=
                            `• *${p.product_name}*\n` +
                            `  SKU   : \`${p.buyer_sku_code}\`\n` +
                            `  Harga : *Rp ${p.price?.toLocaleString("id-ID")}*\n` +
                            `  Stok  : ${stok}\n\n`;
                    }

                    response +=
                        `_Detail: \`${m.prefix}harga <kode_sku>\`_\n` +
                        `_Kembali: \`${m.prefix}harga ${kategori}\`_`;

                    return m.reply(response);
                }

                const totalProduk = produkAktif.filter(
                    p => p.category === kategori && p.brand === brand
                ).length;

                let response =
                    `⌑ *Tipe Produk — ${brand}*\n` +
                    `_Kategori: ${kategori} · ${typeListDari.length} tipe · ${totalProduk} produk_\n\n`;

                for (const t of typeListDari) {
                    const jumlah = produkAktif.filter(
                        p => p.category === kategori && p.brand === brand && p.type === t
                    ).length;
                    response +=
                        `• *${t}* (${jumlah} produk)\n` +
                        `  → \`${m.prefix}harga ${brand} ${t}\`\n\n`;
                }

                response += `_Kembali: \`${m.prefix}harga ${kategori}\`_`;
                return m.reply(response);
            }

            const kategoriCocok = cariCocok(kategoriList, query);

            if (kategoriCocok) {
                const brandDariKat = getUnik("brand", p => p.category === kategoriCocok);
                const totalProduk  = produkAktif.filter(p => p.category === kategoriCocok).length;

                if (brandDariKat.length === 1) {
                    const brand = brandDariKat[0];
                    const typeListDari = getUnik("type",
                        p => p.category === kategoriCocok && p.brand === brand
                    );

                    if (typeListDari.length <= 1) {
                        const aktif = produkAktif.filter(p => p.category === kategoriCocok);

                        let response =
                            `❒ *${kategoriCocok} — ${brand}*\n` +
                            `_Total ${aktif.length} produk aktif_\n\n`;

                        for (const p of aktif) {
                            const stok = p.unlimited_stock ? "∞" : p.stock > 0 ? p.stock : "☒";
                            response +=
                                `• *${p.product_name}*\n` +
                                `  SKU   : \`${p.buyer_sku_code}\`\n` +
                                `  Harga : *Rp ${p.price?.toLocaleString("id-ID")}*\n` +
                                `  Stok  : ${stok}\n\n`;
                        }

                        response += `_Detail: \`${m.prefix}harga <kode_sku>\`_`;
                        return m.reply(response);
                    }

                    let response =
                        `⌑ *Tipe Produk — ${brand}*\n` +
                        `_Kategori: ${kategoriCocok} · ${typeListDari.length} tipe_\n\n`;

                    for (const t of typeListDari) {
                        const jumlah = produkAktif.filter(
                            p => p.category === kategoriCocok && p.brand === brand && p.type === t
                        ).length;
                        response +=
                            `• *${t}* (${jumlah} produk)\n` +
                            `  → \`${m.prefix}harga ${brand} ${t}\`\n\n`;
                    }

                    response += `_Kembali: \`${m.prefix}harga\`_`;
                    return m.reply(response);
                }

                let response =
                    `❖ *Brand di Kategori ${kategoriCocok}*\n` +
                    `_${brandDariKat.length} brand · ${totalProduk} produk_\n\n`;

                for (const brand of brandDariKat) {
                    const jumlahProduk = produkAktif.filter(
                        p => p.category === kategoriCocok && p.brand === brand
                    ).length;
                    const typeListDari = getUnik("type",
                        p => p.category === kategoriCocok && p.brand === brand
                    );
                    response +=
                        `• *${brand}*\n` +
                        `  ${typeListDari.length} tipe · ${jumlahProduk} produk\n` +
                        `  → \`${m.prefix}harga ${brand}\`\n\n`;
                }

                response += `_Kembali: \`${m.prefix}harga\`_`;
                return m.reply(response);
            }

            const brandCocok = cariCocok(brandList, query);

            if (brandCocok) {
                const typeListDari = getUnik("type", p => p.brand === brandCocok);
                const kategoriDari = [...new Set(
                    produkAktif.filter(p => p.brand === brandCocok).map(p => p.category)
                )].join(", ");
                const totalProduk  = produkAktif.filter(p => p.brand === brandCocok).length;

                if (typeListDari.length <= 1) {
                    const aktif = produkAktif.filter(p => p.brand === brandCocok);

                    let response =
                        `❒ *Daftar Harga ${brandCocok}*\n` +
                        `_Kategori: ${kategoriDari} · Total ${aktif.length} produk_\n\n`;

                    for (const p of aktif) {
                        const stok = p.unlimited_stock ? "∞" : p.stock > 0 ? p.stock : "☒";
                        response +=
                            `• *${p.product_name}*\n` +
                            `  SKU   : \`${p.buyer_sku_code}\`\n` +
                            `  Harga : *Rp ${p.price?.toLocaleString("id-ID")}*\n` +
                            `  Stok  : ${stok}\n\n`;
                    }

                    response +=
                        `_Detail: \`${m.prefix}harga <kode_sku>\`_\n` +
                        `_Kembali: \`${m.prefix}harga ${kategoriDari}\`_`;

                    return m.reply(response);
                }

                let response =
                    `⌑ *Tipe Produk — ${brandCocok}*\n` +
                    `_Kategori: ${kategoriDari} · ${typeListDari.length} tipe · ${totalProduk} produk_\n\n`;

                for (const t of typeListDari) {
                    const jumlah = produkAktif.filter(
                        p => p.brand === brandCocok && p.type === t
                    ).length;
                    response +=
                        `• *${t}* (${jumlah} produk)\n` +
                        `  → \`${m.prefix}harga ${brandCocok} ${t}\`\n\n`;
                }

                response += `_Kembali: \`${m.prefix}harga ${kategoriDari}\`_`;
                return m.reply(response);
            }

            console.log(`[Harga] Cek SKU spesifik: ${query}`);

            const dariCache = semuaProduk.find(
                p =>
                    p.buyer_sku_code?.toLowerCase() === query.toLowerCase() ||
                    p.buyer_sku_code?.toUpperCase() === query.toUpperCase()
            );

            const produk = dariCache || await getProductPrice(query.toUpperCase()) || await getProductPrice(query);

            if (!produk) {
                const byNama = semuaProduk.find(
                    p => p.product_name?.toLowerCase().includes(query.toLowerCase())
                );

                if (!byNama) {
                    return m.reply(
                        `☒ *Tidak ditemukan*\n\n` +
                        `*${query}* tidak cocok dengan kategori, brand, tipe, atau kode SKU manapun.\n\n` +
                        `Ketik \`${m.prefix}harga\` untuk lihat semua kategori.`
                    );
                }

                const stok = byNama.unlimited_stock ? "Unlimited ∞" : byNama.stock > 0 ? `${byNama.stock} unit` : "☒ Habis";
                return m.reply(
                    `≡ *Detail Produk*\n\n` +
                    `• Nama      : *${byNama.product_name}*\n` +
                    `• SKU       : \`${byNama.buyer_sku_code}\`\n` +
                    `• Kategori  : ${byNama.category}\n` +
                    `• Brand     : ${byNama.brand}\n` +
                    `• Tipe      : ${byNama.type || "-"}\n` +
                    `• Harga     : *Rp ${byNama.price?.toLocaleString("id-ID")}*\n` +
                    `• Stok      : ${stok}\n` +
                    `• Multi     : ${byNama.multi ? "☑ Bisa" : "☒ Tidak"}\n\n` +
                    `${byNama.desc ? `_${byNama.desc}_` : ""}`
                );
            }

            const stok = produk.unlimited_stock
                ? "Unlimited ∞"
                : produk.stock > 0 ? `${produk.stock} unit` : "☒ Habis";

            const cutoff =
                produk.start_cut_off === "00:00" && produk.end_cut_off === "00:00"
                    ? "Tidak ada"
                    : `${produk.start_cut_off} - ${produk.end_cut_off}`;

            await m.reply(
                `≡ *Detail Produk*\n\n` +
                `• Nama      : *${produk.product_name}*\n` +
                `• SKU       : \`${produk.buyer_sku_code}\`\n` +
                `• Kategori  : ${produk.category}\n` +
                `• Brand     : ${produk.brand}\n` +
                `• Tipe      : ${produk.type || "-"}\n` +
                `• Harga     : *Rp ${produk.price?.toLocaleString("id-ID")}*\n` +
                `• Stok      : ${stok}\n` +
                `• Status    : ${produk.buyer_product_status ? "☑ Aktif" : "☒ Nonaktif"}\n` +
                `• Cut Off   : ${cutoff}\n` +
                `• Multi     : ${produk.multi ? "☑ Bisa" : "☒ Tidak"}\n\n` +
                `${produk.desc ? `_${produk.desc}_` : ""}`
            );

        } catch (error) {
            console.error("[Harga] Error:", error);
            await m.reply(
                `☒ *Gagal ambil daftar harga*\n\n` +
                `• Alasan: ${error?.data?.message || error?.message || "Tidak diketahui"}\n\n` +
                `_Coba lagi beberapa saat._`
            );
        }
    },
};