import axios from "axios";
import * as cheerio from "cheerio";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export default {
	name: "Anichin Search",
	description: "Mencari anime berdasarkan judul di Anichin.",
	command: ["anichins", "anichinsearch"],
	usage: "$prefix$command <kata kunci>",
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
		const query = m.text?.trim();
		if (!query) {
			return m.reply(`[!] Masukkan judul anime yang ingin dicari.\nContoh: \`.anichins soul land\``);
		}

		await m.reply(`⟳ Sedang mencari anime dengan kata kunci *"${query}"*...`);

		try {
			const client = axios.create({
				baseURL: "https://anichin.cafe",
				headers: {
					"User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
					"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
					"Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
					"Accept-Encoding": "gzip, deflate, br",
					"Connection": "keep-alive",
					"Upgrade-Insecure-Requests": "1",
					"Sec-Fetch-Dest": "document",
					"Sec-Fetch-Mode": "navigate",
					"Sec-Fetch-Site": "none",
					"Cache-Control": "max-age=0",
					"Cookie": "_ga=GA1.1.1210577259.1774491552; _ga_LKVWRJK4J4=GS2.1.s1774491551$o1$g1$t1774493839$j57$l0$h0",
					"Referer": "https://anichin.cafe/",
				},
				timeout: 15000,
				decompress: true,
			});

			const encoded = encodeURIComponent(query).replace(/%20/g, "+");
			let page = 1;
			let allResults = [];

			while (true) {
				const url = page === 1 ? `/?s=${encoded}` : `/page/${page}/?s=${encoded}`;

				let data, status;
				try {
					const res = await client.get(url);
					data = res.data;
					status = res.status;
				} catch (err) {
					if (err.response?.status === 404) break;
					throw err;
				}

				const $ = cheerio.load(data);
				const noResult = $(".no-result, .nothing-found, .not-found").length > 0;
				if (noResult) break;

				const cards = $(".bsx");
				if (!cards.length) break;

				cards.each((_, el) => {
					const card = $(el);
					const titleFromH = card.find("h2, h3").last().text().trim();
					const titleFromAttr = card.find("a").first().attr("title") || "";
					const title = titleFromH || titleFromAttr;

					const link = card.find("a").first().attr("href") || "";
					const thumb = card.find("img").first().attr("src") || card.find("img").first().attr("data-src") || "";
					const episode = card.find(".epx, .ep").first().text().trim();
					const rating = card.find(".numscore, .score").first().text().trim();
					const type = card.find(".typez, .type").first().text().trim();
					const seriesName = card.find(".tt").first().text().trim();

					if (title && link) {
						allResults.push({
							title,
							seriesName: seriesName !== title ? seriesName : "",
							episode,
							type,
							rating,
							link,
							thumbnail: thumb,
						});
					}
				});

				const hasNext = $("a.next, .nav-links .next, .pagination .next, link[rel='next']").length > 0;
				if (!hasNext) break;

				page++;
				await delay(1000);
			}

			if (allResults.length === 0) {
				return m.reply(`[!] Tidak ada hasil yang ditemukan untuk pencarian *"${query}"*.`);
			}

			let text = `🔍 *ANICHIN SEARCH*\n`;
text += `━━━━━━━━━━━━━━━━━━\n`;
text += `Query: "${query}"\n\n`;

			allResults.forEach((a, i) => {
				const ep   = a.episode ? `[ ${a.episode} ]` : "";
				const rat  = a.rating  ? `⚝ ${a.rating}`   : "";
				const type = a.type    ? `{ ${a.type} }`     : "";
				const info = [type, ep, rat].filter(Boolean).join("  •  ");

				text += ` *[${String(i + 1).padStart(2, '0')}] ${a.title}*\n`;

				let lines = [];
				if (a.seriesName) lines.push(`Series : ${a.seriesName}`);
				if (info)         lines.push(`Info   : ${info}`);
				                  lines.push(`Link   : ${a.link}`);
				if (a.thumbnail)  lines.push(`Thumb  : ${a.thumbnail}`);

				lines.forEach((line, index) => {
					if (index === lines.length - 1) {
						text += `   └─ ${line}\n`;
					} else {
						text += `   ├─ ${line}\n`;
					}
				});
				text += `\n`;
			});

			text += `═`.repeat(32) + `\n`;
			text += ` ≡  Total Hasil : ${allResults.length} anime\n`;
			text += `═`.repeat(32);

			return m.reply(text.trim());

		} catch (error) {
			console.error("[ANICHIN SEARCH ERROR]:", error.message);
			return m.reply(`[!] Gagal mencari anime. Terjadi kesalahan sistem atau web sedang down.`);
		}
	},
};
