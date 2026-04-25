const getVideyBuffer = async (videoId) => {
	const targetUrl = `https://cdnvideyco.de/e/${videoId}`;

	try {
		const htmlResponse = await fetch(targetUrl, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
			}
		});

		if (!htmlResponse.ok) throw new Error(`Gagal akses server (${htmlResponse.status})`);
		const html = await htmlResponse.text();

		let videoUrl = null;
		const sourceMatch = html.match(/<source[^>]+src=["']([^"']+)["']/i);
		const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);

		if (sourceMatch) {
			videoUrl = sourceMatch[1];
		} else if (videoMatch) {
			videoUrl = videoMatch[1];
		} else {
			const mp4Match = html.match(/(https?:\/\/[^\s"'>]+\.mp4)/i);
			if (mp4Match) videoUrl = mp4Match[1];
		}

		if (!videoUrl) throw new Error("Link video tidak ditemukan.");
		if (videoUrl.startsWith("/")) videoUrl = `https://cdnvideyco.de${videoUrl}`;

		const vidResponse = await fetch(videoUrl, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
				"Referer": targetUrl
			}
		});

		if (!vidResponse.ok) throw new Error(`Gagal mendownload video (${vidResponse.status})`);

		const arrayBuffer = await vidResponse.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		if (buffer.length < 10000) throw new Error("Ukuran file kecil, kemungkinan keblokir server.");

		return { success: true, buffer };
	} catch (error) {
		return { success: false, message: error.message };
	}
};

export default {
	name: "videy",
	description: "Downloader Video dari videy.co",
	command: ["vdy", "videy"],
	usage: "$prefix$command https://videy.co/v/y5Z6a7B8c",
	permissions: "all",
	hidden: false,
	failed: "Failed to execute %command: %error",
	wait: "Mohon tunggu sebentar...", 
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
			return m.reply("Input URL Videy.");
		}

		const idMatch = input.match(/(?:videy\.co\/v\/|cdnvideyco\.de\/e\/)([a-zA-Z0-9_-]+)/);
		
		if (!idMatch) {
			return m.reply("Link tidak valid! Pastikan kamu mengirim link dari videy.co.");
		}

		const videoId = idMatch[1];
		
		const { success, message, buffer } = await getVideyBuffer(videoId);

		if (!success) {
			return m.reply(`Gagal download: ${message}`);
		}

		await m.reply({
			video: buffer,
			caption: "Berhasil!",
		});
	},
};

