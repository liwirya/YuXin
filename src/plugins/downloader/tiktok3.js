import snaptik from "#lib/scrapers/snaptik";

export default {
	name: "Tiktok",
	description: "Downloader TikTok",
	command: ["tt3", "snaptik"],
	usage: "$prefix$command https://vt.tiktok.com/ZSHbN7jEy/",
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
		const input =
			m.text && m.text.trim() !== ""
				? m.text
				: m.quoted && m.quoted.url
					? m.quoted.url
					: null;

		if (!input) {
			return m.reply("Input URL TikTok.");
		}

		if (!input.includes('tiktok.com')) {
			return m.reply("URL tidak valid.");
		}

		const result = await snaptik(input);

		if (!result || !result.status) {
			return m.reply(`Failed: ${result?.message || "Gagal mengambil data."}`);
		}

		const data = result.data;

		if (!data.hd && !data.sd) {
			return m.reply("Video tidak ditemukan atau private.");
		}

		let caption = `*TikTok Downloader*\n\n`;
		caption += `*Source:*\n${input}\n`;

		const videoUrl = data.hd || data.sd;
		const quality = data.hd ? "HD" : "SD";
		let videoCaption = `*Quality:* ${quality}\n` + caption;
		
		await m.reply({
			video: { url: videoUrl },
			caption: videoCaption.trim(),
		});

		if (data.audio) {
			await m.reply({
				audio: { url: data.audio },
				mimetype: 'audio/mp4',
				ptt: false 
			});
		}
	},
};
