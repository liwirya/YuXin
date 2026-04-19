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

		const urlRegex = /(https?:\/\/[^\s]+)/;
		const match = input.match(urlRegex);
		if (!match || !match[0].includes('tiktok.com')) {
			return m.reply("URL tidak valid.");
		}
		const cleanUrl = match[0];

		const result = await snaptik(cleanUrl);

		if (!result || !result.status) {
			return m.reply(`Failed: ${result?.message || "Gagal mengambil data."}`);
		}

		const data = result.data;

		if (!data.hd && !data.sd) {
			return m.reply("Video tidak ditemukan atau private.");
		}

		let caption = `*TikTok Downloader*\n\n`;
		caption += `*Source:*\n${cleanUrl}\n`;

		const videoUrl = data.hd || data.sd;
		const quality = data.hd ? "HD" : "SD";
		let videoCaption = `*Quality:* ${quality}\n` + caption;
		
		try {
			const response = await fetch(videoUrl, {
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					"Referer": "https://www.tiktok.com/"
				}
			});

			if (!response.ok) {
				return m.reply("Gagal mengunduh media dari server TikTok.");
			}

			const arrayBuffer = await response.arrayBuffer();
			const videoBuffer = Buffer.from(arrayBuffer);

			await m.reply({
				video: videoBuffer,
				caption: videoCaption.trim(),
			});

			if (data.audio) {
				const audioRes = await fetch(data.audio, {
					headers: { "User-Agent": "Mozilla/5.0" }
				});
				
				if (audioRes.ok) {
					const audioBuf = await audioRes.arrayBuffer();
					await m.reply({
						audio: Buffer.from(audioBuf),
						mimetype: 'audio/mp4',
						ptt: false 
					});
				}
			}
		} catch (err) {
			m.reply(`Terjadi error saat memproses media: ${err.message}`);
		}
	},
};
