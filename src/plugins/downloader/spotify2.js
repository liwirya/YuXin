import spotmate from "#lib/scrapers/spotify";

export default {
	name: "spotify",
	description: "Downloader Spotify Track.",
	command: ["spo2", "spotify2"],
	usage: "$prefix$command https://open.spotify.com/track/4eHbdreAnSOrDDsFfc4Fpm",
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
				: m.quoted && m.quoted.text
					? m.quoted.text
					: null;

		if (!input) {
			return m.reply("Input URL Spotify Track.");
		}

		if (!input.includes('spotify.com')) {
			return m.reply("URL tidak valid. Harap masukkan link Spotify yang benar.");
		}

		const result = await spotmate(input);

		if (!result || !result.success) {
			return m.reply(`Failed. ${result?.message || "Tidak dapat mengambil data lagu."}`);
		}

		const data = result.data;
		
		const durationMin = Math.floor(data.duration_ms / 60000);
		const durationSec = ((data.duration_ms % 60000) / 1000).toFixed(0);
		const formattedDuration = `${durationMin}:${(durationSec < 10 ? '0' : '')}${durationSec}`;

		let caption = `*Spotify Downloader*\n\n`;
		caption += `*Title:* ${data.title}\n`;
		caption += `*Artist:* ${data.artist}\n`;
		caption += `*Duration:* ${formattedDuration}\n`;

		if (data.thumbnail) {
			await m.reply({
				image: { url: data.thumbnail },
				caption: caption.trim(),
			});
		} else {
			await m.reply(caption.trim());
		}

		return m.reply({
			audio: { url: data.download_url },
			mimetype: "audio/mpeg",
			ptt: false, 
			fileName: `${data.title} - ${data.artist}.mp3`,
		});
	},
};
