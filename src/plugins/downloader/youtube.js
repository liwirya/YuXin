import { fileTypeFromBuffer } from "file-type";

async function YtDown(youtubeUrl, type) {
	const baseUrl = "https://app.ytdown.to";
	const headers = {
		"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
		"X-Requested-With": "XMLHttpRequest",
		"Accept": "application/json, text/javascript, */*; q=0.01",
		"User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
		"Cookie": "PHPSESSID=2mqep3me99ba1tpr5acr0r3t94",
	};

	await fetch(`${baseUrl}/cooldown.php`, {
		method: "POST",
		headers,
		body: new URLSearchParams({ action: "check" }),
	});

	const proxyRes = await fetch(`${baseUrl}/proxy.php`, {
		method: "POST",
		headers,
		body: new URLSearchParams({ url: youtubeUrl }),
	});

	if (!proxyRes.ok) throw new Error("Gagal terhubung ke ytdown.");
	const proxyData = await proxyRes.json();
	if (proxyData.api?.status !== "ok") throw new Error("Video tidak ditemukan atau link tidak valid.");

	const videoInfo = proxyData.api;
	let selectedMedia;

	if (type === "audio") {
		selectedMedia =
			videoInfo.mediaItems.find((m) => m.type === "Audio" && m.mediaExtension.toLowerCase() === "mp3") ||
			videoInfo.mediaItems.find((m) => m.type === "Audio");
	} else {
		selectedMedia =
			videoInfo.mediaItems.find((m) => m.type === "Video" && m.mediaQuality === "SD") ||
			videoInfo.mediaItems.find((m) => m.type === "Video" && m.mediaQuality === "HD") ||
			videoInfo.mediaItems.find((m) => m.type === "Video");
	}

	if (!selectedMedia) throw new Error("Format yang diminta tidak tersedia untuk video ini.");

	let pollingUrl = selectedMedia.mediaUrl;
	let actualDownloadUrl = null;
	let retryCount = 0;
	const maxRetries = 25;
	
	while (retryCount < maxRetries) {
		const response = await fetch(pollingUrl, { headers });
		const contentType = response.headers.get("content-type") || "";

		if (contentType.includes("application/json")) {
			const jsonData = await response.json();
			
			const loadingStatuses = ["processing", "pending", "queued", "starting", "downloading"];
			
			if (loadingStatuses.includes(jsonData.status)) {
				retryCount++;
				await new Promise((r) => setTimeout(r, 3000));
				continue;
			} else if (jsonData.status === "completed") {
				actualDownloadUrl = jsonData.url || jsonData.downloadUrl || jsonData.fileUrl || jsonData.link || jsonData.download_url || jsonData.file;
				
				if (!actualDownloadUrl) {
					const match = JSON.stringify(jsonData).match(/https?:\/\/[^\s"']+/);
					if (match) actualDownloadUrl = match[0];
				}
				
				if (!actualDownloadUrl) {
					if (type === "audio") {
						actualDownloadUrl = selectedMedia.mediaPreviewUrl;
					} else {
						throw new Error("Gagal mendapatkan link video yang berisi audio dari server.");
					}
				}
				break;
			} else {
				throw new Error(`Server ytdown error: ${jsonData.status || "Unknown"}`);
			}
		} else {
			actualDownloadUrl = pollingUrl;
			break;
		}
	}

	if (!actualDownloadUrl) throw new Error("Timeout saat memproses media.");

	return {
		url: actualDownloadUrl,
		title: videoInfo.title,
		channel: videoInfo.userInfo.name,
		headers
	};
}

export default {
	name: "youtube",
	description: "Download video atau audio dari YouTube",
	command: ["yt2","ytmp4", "ytmp3"],
	category: "downloader",
	permissions: "all",
	cooldown: 5,
	limit: false,
	hidden: false,
	react: true,
	usage: "$prefix$command <url>",
	wait: "Memproses, tunggu sebentar...",
	failed: "Gagal menjalankan perintah",

	execute: async (m) => {
		const input =
			m.text?.trim() ||
			m.quoted?.url ||
			null;

		if (!input) {
			return m.reply("Masukkan URL YouTube\nContoh: .ytmp4 https://youtu.be/h686-hQmsos?si=xB-VY_NccPY7WTOR");
		}

		try {
			const isAudio = m.command.toLowerCase() === "ytmp3";
			const type = isAudio ? "audio" : "video";

			const result = await YtDown(input, type);

			const res = await fetch(result.url, { headers: result.headers });
			if (!res.ok) throw new Error("Gagal mengunduh media");

			const buf = Buffer.from(await res.arrayBuffer());

			if (buf.length < 50000) {
				throw new Error("File corrupt, coba lagi");
			}

			const file = await fileTypeFromBuffer(buf);

			const caption = `🎬 *YouTube Downloader*\n\n` +
							`📌 ${result.title}\n` +
							`👤 ${result.channel}`;

			if (isAudio) {
				return m.reply({
					audio: buf,
					mimetype: file?.mime || "audio/mp4",
					ptt: false
				});
			}

			return m.reply({
				video: buf,
				caption: caption,
				mimetype: file?.mime || "video/mp4"
			});

		} catch (err) {
			return m.reply(`Gagal memproses YouTube\n${err.message}`);
		}
	}
};