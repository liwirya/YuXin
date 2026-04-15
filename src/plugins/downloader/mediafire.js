import axios from "axios";
import cheerio from "cheerio";
import { URL } from "url";

class MediaFireDownloader {
	constructor() {
		this.axios = axios.create({
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
				"Accept-Encoding": "gzip, deflate, br",
				"Connection": "keep-alive",
				"Upgrade-Insecure-Requests": "1"
			},
			timeout: 30000
		});
	}

	async extractDownloadUrl(mediafireUrl) {
		try {
			const response = await this.axios.get(mediafireUrl);
			const $ = cheerio.load(response.data);
			
			let downloadButton = $("#downloadButton");
			if (!downloadButton.length || !downloadButton.attr("href")) {
				downloadButton = $("a.input.popsok");
			}
			if (!downloadButton.length || !downloadButton.attr("href")) {
				downloadButton = $(".download_link a.input");
			}

			if (downloadButton.length && downloadButton.attr("href")) {
				let downloadUrl = downloadButton.attr("href");
				if (downloadUrl.startsWith("//")) {
					downloadUrl = "https:" + downloadUrl;
				}

				const fileName = this._extractFilename($, downloadUrl);

				return {
					file_name: fileName,
					download_url: downloadUrl,
					mimetype: this._getMimetype(fileName),
					file_size: this._extractFilesize(downloadButton)
				};
			}
			return null;
		} catch (error) {
			return null;
		}
	}

	_extractFilename($, downloadUrl) {
		try {
			const filenameMeta = $('meta[property="og:title"]').attr("content");
			if (filenameMeta) return filenameMeta;

			const title = $("title").text();
			if (title) {
				const filename = title.split(" - ")[0].trim();
				if (filename) return filename;
			}

			try {
				const url = new URL(downloadUrl);
				const pathParts = url.pathname.split("/");
				for (let i = pathParts.length - 1; i >= 0; i--) {
					if (pathParts[i] && pathParts[i].includes(".")) {
						return decodeURIComponent(pathParts[i]);
					}
				}
			} catch (e) {}

			return "Downloaded_File";
		} catch (e) {
			return "Downloaded_File";
		}
	}

	_extractFilesize(element) {
		try {
			const text = element.text();
			const match = text.match(/\(([0-9.]+\s*[KMGT]?B)\)/i);
			return match ? match[1] : "Unknown Size";
		} catch (e) {
			return "Unknown Size";
		}
	}

	_getMimetype(filename) {
		if (!filename) return "application/octet-stream";
		
		const ext = filename.split(".").pop().toLowerCase();
		const mimetypes = {
			zip: "application/zip",
			rar: "application/x-rar-compressed",
			"7z": "application/x-7z-compressed",
			tar: "application/x-tar",
			gz: "application/gzip",
			pdf: "application/pdf",
			doc: "application/msword",
			docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			xls: "application/vnd.ms-excel",
			xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			ppt: "application/vnd.ms-powerpoint",
			pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
			txt: "text/plain",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			apk: "application/vnd.android.package-archive",
			json: "application/json",
			mp3: "audio/mpeg",
			mp4: "video/mp4",
		};
		return mimetypes[ext] || "application/octet-stream";
	}
}

export default {
	name: "Mediafire",
	description: "Mendownload file dari link MediaFire.",
	command: ["mf", "mediafire"],
	usage: "$prefix$command <url-mediafire>",
	permissions: "all",
	hidden: false,
	failed: "Failed to execute %command: %error",
	wait: true,
	category: "downloader",
	cooldown: 10,
	limit: true,
	react: true,
	botAdmin: false,
	group: false,
	private: false,
	owner: false,

	execute: async (m) => {
		const url = m.text?.trim();
		if (!url || !url.includes("mediafire.com")) {
			return m.reply(`Masukkan URL MediaFire yang valid.\nContoh: \`.mf https://www.mediafire.com/file/... \``);
		}

		await m.reply(`⟳ Memproses link MediaFire. Tunggu sebentar...`);

		try {
			const mfDownloader = new MediaFireDownloader();
			const result = await mfDownloader.extractDownloadUrl(url);

			if (!result || !result.download_url) {
				return m.reply(`[!] Gagal mengekstrak link download. Pastikan link tidak diproteksi password atau file masih tersedia.`);
			}

			let text = `📥 *MediaFire Downloader*\n\n`;
            text += `File     : ${result.file_name}\n`;
            text += `Ukuran   : ${result.file_size}\n`;
            text += `Format   : ${result.mimetype.split('/')[1] || "File"}\n\n`;
            text += `⟳ Mengirim file, tunggu ya...`;

			await m.reply(text.trim());

			return m.reply({
				document: { url: result.download_url },
				fileName: result.file_name,
				mimetype: result.mimetype
			});

		} catch (error) {
			console.error("MEDIAFIRE ERROR", error.message);
			return m.reply(`[!] Terjadi kesalahan saat mencoba mengunduh dari MediaFire.`);
		}
	},
};
