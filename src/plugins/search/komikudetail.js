import axios from 'axios';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

export default {
	name: "Komiku Detail",
	description: "Mengambil detail informasi dan chapter dari link Komiku",
	command: ["komikudetail", "komkd", "komikudetail"],
	permissions: "all",
	hidden: false,
	failed: "Failed to execute %command: %error",
	category: "search",
	cooldown: 5,
	usage: "$prefix$command [link_komiku]",
	react: true,
	wait: null,

	execute: async (m, { sock }) => {
		if (m.args.length === 0) {
			return m.reply(
				`Harap masukkan link komik dari Komiku!\n\n*Contoh:* \`${m.prefix}${m.command} https://komiku.org/manga/soul-land-3/\``
			);
		}

		const url = m.args[0];

		if (!url.includes('komiku.org/manga/')) {
			return m.reply(`Link tidak valid!\nContoh: https://komiku.org/manga/soul-land-3/`);
		}

		await m.reply(" _Tunggu sebentar..._");

		try {
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://komiku.org/',
                'Connection': 'keep-alive'
            };

            await client.get('https://komiku.org/', { headers });

			const response = await client.get(url, { headers });

			if (response.status !== 200) {
				throw new Error(`API Error: ${response.status}`);
			}

			const $ = cheerio.load(response.data);

            const title = $('h1[itemprop="name"]').text().trim() || $('#Judul h1').text().trim();
            const thumbnail = $('.ims img').attr('src');
            const altTitle = $('.inftable tr:contains("Judul Lainnya") td').last().text().trim() || "-";
            const synopsis = $('#Sinopsis p').map((i, el) => $(el).text().trim()).get().join('\n');

            const genres = [];
            $('.genre li a').each((i, el) => {
                genres.push($(el).text().trim());
            });

            let status = "-"; let author = "-"; let type = "-"; let released = "-";
            $('.inftable tr').each((i, el) => {
                const key = $(el).find('td:nth-child(1)').text().trim().toLowerCase();
                const val = $(el).find('td:nth-child(2)').text().trim();
                if (key.includes('status')) status = val;
                if (key.includes('pengarang') || key.includes('author')) author = val;
                if (key.includes('jenis') || key.includes('konsep')) type = val;
                if (key.includes('rilis') || key.includes('tahun')) released = val;
            });

            const chapters = [];
            $('#Bab_Terbaru a, table#Daftar_Chapter a').each((i, el) => {
                const chapterLink = $(el).attr('href');
                if (chapterLink && (chapterLink.includes('chapter') || chapterLink.includes('/ch/'))) {
                    chapters.push({
                        title: $(el).text().trim(),
                        url: chapterLink.startsWith('http') ? chapterLink : `https://komiku.org${chapterLink}`
                    });
                }
            });

            if (!title) {
                return m.reply("Gagal menemukan data komik dari link tersebut.");
            }

			let replyText = `📚 *Detail Komik*\n\n`;
            replyText += `Judul     : ${title}\n`;
            if (altTitle !== "-") replyText += `Alternatif: ${altTitle}\n`;
            replyText += `Author    : ${author}\n`;
            replyText += `Status    : ${status}\n`;
            replyText += `Tipe      : ${type}\n`;
            replyText += `Rilis     : ${released}\n`;
            replyText += `Genre     : ${genres.join(', ')}\n\n`;

            replyText += `📖 Sinopsis\n${synopsis}\n\n`;
            replyText += `📑 Total Chapter: ${chapters.length}\n\n`;
            replyText += `📂 Chapter Terbaru:\n`;

			const limit = Math.min(chapters.length, 10);
			for (let i = 0; i < limit; i++) {
				replyText += `▪️ ${chapters[i].title}\n   ${chapters[i].url}\n`;
			}

			if (chapters.length > limit) {
	replyText += `\nMasih ada ${chapters.length - limit} chapter lagi\nCek link buat lanjut baca`;
          }
	
			await m.reply({
				text: replyText.trim(),
				contextInfo: {
					externalAdReply: {
						title: title,
						body: `Status: ${status} | Tipe: ${type}`,
						renderLargerThumbnail: true,
						sourceUrl: url,
						mediaType: 1,
						thumbnailUrl: thumbnail || "https://komiku.org/wp-content/uploads/2022/03/Logo-Komiku.png",
					},
				},
			});

		} catch (error) {
			console.error("Komiku Detail Error:", error);
            
            if (error.response && (error.response.status === 403 || error.response.status === 503)) {
                await m.reply(`*Akses Ditolak (403/503)*\nSistem keamanan DDOS-Guard dari Komiku sedang memblokir bot.`);
            } else {
			    await m.reply(`*Terjadi Kesalahan!*\nGagal mengambil data dari server.\nPesan error: _${error.message}_`);
            }
		}
	},
};
