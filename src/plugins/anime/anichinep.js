import axios from "axios";
import * as cheerio from "cheerio";

export default {
	name: "Anichin Episode",
	description: "Mengambil info, link video, dan link download dari halaman episode Anichin.",
	command: ["anichinep", "anieps"],
	usage: "$prefix$command <url-episode>",
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
		const url = m.text?.trim();
		if (!url || !url.startsWith("http")) {
			return m.reply(`[!] Masukkan URL episode Anichin yang valid.\nContoh: \`.anichinep https://anichin.cafe/judul-episode/\``);
		}

		await m.reply(`⟳ Memproses link episode...`);

		try {
			const client = axios.create({
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
					"Cookie": "_ga=GA1.1.1210577259.1774491552; _ga_LKVWRJK4J4=GS2.1.s1774507127$o2$g1$t1774507134$j53$l0$h0",
					"Referer": "https://anichin.cafe/",
				},
				timeout: 15000,
				decompress: true,
			});

			const { data } = await client.get(url);
			const $ = cheerio.load(data);
			const result = {};

			result.title = $("h1.entry-title, h1.tt, .bixbox h1").first().text().trim();
			result.seriesTitle = $("a[href*='/seri/']").first().text().trim() || "-";
			result.releaseDate = $("time, .updated, .episodeinfo .date").first().text().trim() || "-";

			result.prevEpisode = $("a[rel='prev'], .naveps a.prev, .epcontrol .prev a").first().attr("href") || "-";
			result.nextEpisode = $("a[rel='next'], .naveps a.next, .epcontrol .next a").first().attr("href") || "-";
			result.allEpisodesLink = $("a[href*='/seri/']").first().attr("href") || "-";

			const servers = [];
			$("select option").each((_, el) => {
				const name = $(el).text().trim().replace(/\s+/g, " ");
				const b64 = $(el).attr("value") || "";
				if (!name || !b64 || name.toLowerCase().includes("select")) return;

				let videoUrl = "";
				try {
					const decoded = Buffer.from(b64, "base64").toString("utf-8");
					const match = decoded.match(/src=["']([^"']+)["']/);
					if (match) videoUrl = match[1];
				} catch (_) {}

				servers.push({ name, url: videoUrl });
			});
			result.videoServers = servers;

			const qualities = [];
			$(".soraurlx").each((_, el) => {
				const quality = $(el).find("strong, b").first().text().trim();
				const links = [];
				$(el).find("a").each((_, aEl) => {
					const host = $(aEl).text().trim();
					const href = $(aEl).attr("href") || "";
					if (host && href) links.push({ host, url: href });
				});
				if (quality && links.length > 0) qualities.push({ quality, links });
			});
			result.downloads = qualities;

			let text = `🎬 *Detail Episode*\n`;
            text += `Sumber: Anichin\n\n`;

			text += ` ◈ *${result.title}*\n`;
			text += `   ├─ Series  : ${result.seriesTitle}\n`;
			text += `   └─ Tanggal : ${result.releaseDate}\n\n`;

			text += ` ≡ *NAVIGASI*\n`;
			text += `   ├─ Prev : ${result.prevEpisode}\n`;
			text += `   ├─ Next : ${result.nextEpisode}\n`;
			text += `   └─ All  : ${result.allEpisodesLink}\n\n`;

			text += ` ⊳ *VIDEO SERVER*\n`;
			if (result.videoServers.length === 0) {
				text += `   └─ (Tidak ada server ditemukan)\n\n`;
			} else {
				result.videoServers.forEach((s, i) => {
					const isLast = i === result.videoServers.length - 1;
					text += `   ${isLast ? '└─' : '├─'} [${s.name}]\n`;
					text += `   ${isLast ? ' ' : '│'}  └─ ${s.url}\n`;
				});
				text += `\n`;
			}

			text += ` ⤓ *LINK DOWNLOAD*\n`;
			if (result.downloads.length === 0) {
				text += `   └─ (Tidak ada link download ditemukan)\n`;
			} else {
				result.downloads.forEach((q, qi) => {
					const isLastQuality = qi === result.downloads.length - 1;
					text += `   ${isLastQuality ? '└─' : '├─'} *${q.quality}*\n`;
					
					q.links.forEach((l, li) => {
						const isLastLink = li === q.links.length - 1;
						const prefix = isLastQuality ? ' ' : '│';
						text += `   ${prefix}  ${isLastLink ? '└─' : '├─'} ${l.host} : ${l.url}\n`;
					});
				});
			}

			text += `\n` + `═`.repeat(32);

			return m.reply(text.trim());

		} catch (error) {
			console.error("[ANICHIN EPISODE ERROR]:", error.message);
			return m.reply(`[!] Gagal mengambil data episode. Pastikan URL valid atau coba lagi nanti.`);
		}
	},
};
