import axios from "axios";
import * as cheerio from "cheerio";

export default {
	name: "Anichin Ongoing",
	description: "Melihat daftar anime yang sedang tayang (Ongoing) di Anichin.",
	command: ["anichino"],
	usage: "$prefix$command [opsional: nomor halaman]",
	permissions: "all",
	hidden: false,
	failed: "Failed to execute %command: %error",
	wait: true,
	category: "anime",
	cooldown: 5,
	limit: true,
	react: true,
	botAdmin: false,
	group: false,
	private: false,
	owner: false,

	execute: async (m) => {
		let isFetchAll = true;
		let targetPage = 1;

		if (m.text && m.text.trim() !== "" && !isNaN(m.text.trim())) {
			isFetchAll = false;
			targetPage = parseInt(m.text.trim());
		}

		if (isFetchAll) {
	    await m.reply("⟳ Lagi ambil semua halaman Anichin Ongoing.  Tunggu bentar ya");
       } else {
   	await m.reply(`⟳ Lagi ambil data Anichin Ongoing halaman ${targetPage}`);
        }

		try {
			const client = axios.create({
				baseURL: "https://anichin.cafe",
				headers: {
					"User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
				},
				timeout: 15000
			});

			let allResults = [];
			let currentPage = isFetchAll ? 1 : targetPage;

			while (true) {
				const url = currentPage === 1 ? "/ongoing/" : `/ongoing/page/${currentPage}/`;
				const { data } = await client.get(url);
				const $ = cheerio.load(data);

				const cards = $(".bsx");
				if (!cards.length) break; 

				cards.each((_, el) => {
					const card = $(el);
					const title = card.find("h2, h3, .tt").first().text().trim() || card.find("a").first().attr("title") || "";
					const link = card.find("a").first().attr("href") || "";
					const episode = card.find(".epx, .ep").first().text().trim();
					const rating = card.find(".numscore, .score").first().text().trim();

					if (title && link) {
						allResults.push({ title, episode, rating, link });
					}
				});

				if (!isFetchAll) break;

				const nextPage = $(".next, a.next, .pagination .next").first().attr("href");
				if (!nextPage) break;

				currentPage++;
				await new Promise((r) => setTimeout(r, 1000)); 
			}

			if (allResults.length === 0) {
				return m.reply(`[!] Tidak ada data anime yang ditemukan${!isFetchAll ? ` di halaman ${targetPage}` : ""}.`);
			}

			let text = `🎬 *Anichin Ongoing*\n`;
            text += `${!isFetchAll ? `📄 Halaman ${targetPage}\n` : `📦 Semua Halaman\n`}\n`;

			allResults.forEach((a, i) => {
				const ep = a.episode ? `[ ${a.episode} ]` : "";
				const rat = a.rating ? `⚝ ${a.rating}` : "";
				const info = [ep, rat].filter(Boolean).join("  •  ");

				const paddingLength = isFetchAll ? 3 : 2; 
				text += ` *[${String(i + 1).padStart(paddingLength, '0')}] ${a.title}*\n`;
				
				if (info) text += `   ├─ Info : ${info}\n`;
				text += `   └─ Link : ${a.link}\n\n`;
			});

			text += `═`.repeat(32) + `\n`;
			text += ` ≡  Total Data : ${allResults.length} anime\n`;
			text += `═`.repeat(32);

			return m.reply(text.trim());

		} catch (error) {
			console.error("[ANICHIN ONGOING ERROR]:", error.message);
			return m.reply(`[!] Gagal terhubung ke web. Silakan coba lagi nanti.`);
		}
	},
};
