import { Tiktok } from "#lib/scrapers/tiktok";

export default {
	name: "Tiktok",
	description: "Download video dan audio TikTok tanpa watermark.",
	command: ["tt2", "ssstik"],
	usage: "$prefix$command url tiktok",
	permissions: "all",
	hidden: false,
	failed: "Failed to execute %command: %error",
	wait: true,
	category: "downloader",
	cooldown: 5,
	limit: true,
	react: true,
	botAdmin: false,
	group: false,
	private: false,
	owner: false,

	execute: async (m) => {
		const url = m.text?.trim().split(" ")[0];

		if (!url || !url.includes("tiktok.com")) {
			return m.reply(`Input URL TikTok.`);
		}

		try {
			const ttScraper = new Tiktok();
			const result = await ttScraper.scrape(url);

			if (!result.videoUrl && !result.audioUrl) {
				return m.reply("❌ Media tidak ditemukan");
			}

			let text = `🎥 TikTok Downloader\n\n`;
           text += `👤 ${result.author || "Unknown"}\n`;

           const shortCaption = result.caption 
	       ? (result.caption.length > 100 ? result.caption.substring(0, 100) + "..." : result.caption) 
	       : "Ga ada caption";

          text += `📝 ${shortCaption}\n`;
			if (result.videoUrl) {
				await m.reply({
					video: { url: result.videoUrl },
					caption: text
				});
			} else {
				await m.reply(`Video tidak ditemukan, mencoba ngirim audio saja...`);
			}

			if (result.audioUrl) {
				await m.reply({
					audio: { url: result.audioUrl },
					mimetype: "audio/mpeg",
					fileName: `audio${Date.now()}.mp3`
				});
			}

		} catch (error) {
			console.error("TIKTOK DOWNLOADER ERROR", error.message);
			return m.reply(`Terjadi kesalahan sistem.`);
		}
	},
};