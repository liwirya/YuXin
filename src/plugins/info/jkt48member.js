export default {
	name: "jkt48member",
	description: "Menampilkan profil member JKT48",
	command: ["jkt48member", "memberjkt48", "jkt48"],
	category: "info",
	permissions: "all",
	cooldown: 5,
	limit: false,
	hidden: false,
	react: true,
	usage: "$prefix$command <nama panggilan>",
	wait: "Mengambil detail member...",
	failed: "Gagal menjalankan %command"

	/**
	 * @param {import('baileys').WASocket} sock - The Baileys socket object.
	 * @param {object} m - The serialized message object.
	 * @param {object} ctx - Context object containing text.
	 */
	execute: async (m, { sock, text }) => {
		if (!text) {
			return m.reply("Siapa nama member yang ingin dicari? \n*Contoh:* !jkt48member Alya");
		}

		const searchQuery = text.toLowerCase();
		const targetJid = m.chat || m.from || m.key?.remoteJid; 
		
		try {
			const listResponse = await fetch('https://jkt48.com/api/v1/members?lang=id');
			const listJson = await listResponse.json();

			if (!listJson.status || !listJson.data) {
				return m.reply("Gagal mengambil daftar member dari server JKT48.");
			}

			const basicMember = listJson.data.find(m => 
				m.name.toLowerCase().includes(searchQuery) || 
				m.nickname.toLowerCase().includes(searchQuery)
			);

			if (!basicMember) {
				return m.reply(`Member dengan kata kunci "${text}" tidak ditemukan. Coba gunakan nama panggilannya saja.`);
			}

			const detailUrl = `https://jkt48.com/api/v1/members/${basicMember.jkt48_member_id}?lang=id`;
			const detailResponse = await fetch(detailUrl);
			const detailJson = await detailResponse.json();

			if (!detailJson.status || !detailJson.data) {
				return m.reply("Berhasil menemukan member, tapi gagal mengambil detailnya.");
			}

			const detail = detailJson.data;

			let formattedDate = "-";
			if (detail.birth_date) {
				const dateObj = new Date(detail.birth_date);
				formattedDate = dateObj.toLocaleDateString('id-ID', { 
					day: 'numeric', 
					month: 'long', 
					year: 'numeric' 
				});
			}

			const memberSlug = detail.code.toLowerCase().replace(/_/g, '-');
			const webLink = `https://jkt48.com/member/detail?member=${memberSlug}-${basicMember.jkt48_member_id}&type=${detail.type}`;

			const caption = `🎀 *Profil Member JKT48*\n\n` +
				`👤 Nama       : ${detail.name}\n` +
				`✨ Panggilan  : ${detail.nickname}\n` +
				`🏷 Tim        : ${detail.type}\n\n` +
				`📅 Lahir      : ${formattedDate}\n` +
				`🩸 Darah      : ${detail.blood_type || '-'}\n` +
				`📏 Tinggi     : ${detail.body_height ? detail.body_height + ' cm' : '-'}\n` +
				`🔮 Horoskop   : ${detail.horoscope || '-'}\n\n` +
				`📱 Sosial Media\n` +
				`🐦 Twitter    : ${detail.twitter_account ? '@' + detail.twitter_account : '-'}\n` +
				`📸 Instagram  : ${detail.instagram_account ? '@' + detail.instagram_account : '-'}\n` +
				`🎵 TikTok     : ${detail.tiktok_account ? '@' + detail.tiktok_account : '-'}\n\n` +
				`🔗 Link: ${webLink}`;

			const imageUrl = detail.photo_1 || basicMember.photo;

			await sock.sendMessage(targetJid, { 
				image: { url: imageUrl }, 
				caption: caption 
			}, { quoted: m });

		} catch (error) {
			console.error("Error fetching JKT48 member detail:", error);
			m.reply("Terjadi kesalahan sistem saat mencoba mengambil data member JKT48.");
		}
	},
};
