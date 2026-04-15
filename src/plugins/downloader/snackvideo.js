import { SnackVideo } from "#lib/scrapers/snackvideo";

export default {
	name: "Snack Video",
	description: "Mendownload video dari SnackVideo tanpa watermark.",
	command: ["snack", "snackvideo"],
	usage: "$prefix$command url-snackvideo",
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

		if (!url || (!url.includes("snackvideo.com") && !url.includes("sck.io"))) {
			return m.reply(`Input URL SnackVideo`);
		}

		try {
			const svScraper = new SnackVideo();
			const result = await svScraper.scrape(url);

			if (!result || !result.videoUrl) {
				return m.reply("Video tidak ditemukan");
				}

			let text = `🎥 *SnackVideo Downloader*\n\n`;
            text += `✅ Status: Berhasil\n`;

			return m.reply({
				video: { url: result.videoUrl },
				caption: text
			});

		} catch (error) {
			console.error("SNACKVIDEO ERROR", error.message);
			return m.reply(`Terjadi kesalahan sistem.`);
		}
	},
};
