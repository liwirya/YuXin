export default {
	name: "Data Reportal",
	description: "Mencari artikel atau data statistik dari website DataReportal",
	command: ["datareportal", "drsearch"],
	permissions: "all",
	hidden: false,
	failed: "Failed to execute %command: %error",
	category: "search",
	cooldown: 5,
	usage: "$prefix$command [keyword]",
	react: true,
	wait: "Sedang mencari, tunggu sebentar...",

	execute: async (m, { sock }) => {
		if (m.args.length === 0) {
			return m.reply(
				`Harap masukkan pencarian!\n\n*Contoh:* \`${m.prefix}${m.command[0]} Indonesia\``
			);
		}

		const keyword = m.args.join(" ");

		try {
			const crumbToken = "BQY6xaGis2apOTY1MjA3NDRhYjY4NjRjMTQxNGZhYzY3NmU0ZDU3";
			const cookieString = `crumb=${crumbToken}; ss_performanceCookiesAllowed=true; ss_marketingCookiesAllowed=true; _sharedID=4273937b-3228-4ee5-ab65-ffcaceb41685`;
			
			const url = `https://datareportal.com/api/search/GeneralSearch?crumb=${crumbToken}&q=${encodeURIComponent(keyword)}&p=0`;

			const headers = {
				"accept": "application/json, text/javascript, */*; q=0.01",
				"accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
				"cookie": cookieString,
				"referer": `https://datareportal.com/search?q=${encodeURIComponent(keyword)}`,
				"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
				"x-requested-with": "XMLHttpRequest"
			};

			const response = await fetch(url, { method: "GET", headers: headers });

			if (!response.ok) {
				throw new Error(`API Error: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();

			if (!data.items || data.items.length === 0) {
				return m.reply(`Tidak ditemukan hasil dari pencarian: *${keyword}*`);
			}

			let replyText = `📊 *Hasil Pencarian*\n\n`;
            replyText += `🔎 ${keyword}\n`;
            replyText += `📑 Ditemukan ${data.totalCount} artikel\n\n`;

			const limit = Math.min(data.items.length, 20);
			
			for (let i = 0; i < limit; i++) {
				const item = data.items[i];
				const title = item.title || "Tanpa Judul";
				const link = `https://datareportal.com${item.itemUrl}`;
				const category = item.categories && item.categories.length > 0 ? item.categories.join(", ") : "Umum";				
				const snippetText = item.excerpt 
					? item.excerpt.replace(/<[^>]*>?/gm, '').trim() 
					: "Tidak ada deskripsi.";

				replyText += `*${i + 1}. ${title}*\n`;
				replyText += `📁 Kategori: ${category}\n`;
				replyText += `📝 Snippet: _${snippetText}_\n`;
				replyText += `🔗 Link: ${link}\n\n`;
			}

			if (data.totalCount > limit) {
				replyText += `_Menampilkan ${limit} dari ${data.totalCount} hasil pencarian._\n_Kunjungi situs web untuk melihat seluruhnya._`;
			}
	
			const thumbnailImg = "https://datareportal.com/favicon.ico"; 

			await m.reply({
				text: replyText.trim(),
				contextInfo: {
					externalAdReply: {
						title: "Data Reportal Search",
						body: `Hasil pencarian untuk: ${keyword}`,
						renderLargerThumbnail: true,
						sourceUrl: `https://datareportal.com/search?q=${encodeURIComponent(keyword)}`,
						mediaType: 1,
						thumbnailUrl: thumbnailImg,
					},
				},
			});

		} catch (error) {
			console.error("Data Reportal Error", error);
			await m.reply(`*Terjadi Kesalahan!*\nGagal mengambil data dari server. Pesan error: \n_${error.message}_`);
		}
	},
};
