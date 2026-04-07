export default {
	name: "jkt48team",
	description: "Menampilkan daftar tim atau member JKT48",
	command: ["jkt48team", "teamjkt48"],
	category: "search",
	permissions: "all",
	cooldown: 5,
	limit: false,
	hidden: false,
	react: true,
	usage: "$prefix$command [nama tim]",
	wait: "Mengambil daftar team JKT48...",
	failed: "Terjadi kesalahan saat menjalankan perintah",

	execute: async (m, { args }) => {
		try {
			const res = await fetch("https://jkt48.com/api/v1/members?lang=id");
			const json = await res.json();

			if (!json.status || !json.data) {
				return m.reply("❌ Gagal mengambil data JKT48");
			}

			const members = json.data;

			if (!args?.length) {
				const teams = [...new Set(members.map(m => m.type))];

				let text = `🎀 *JKT48 Teams*\n\n`;

				teams.forEach(team => {
					const count = members.filter(m => m.type === team).length;
					text += `🏷 ${team} (${count})\n`;
				});

				text += `\nGunakan: !jkt48team nama tim\nContoh: !jkt48team LOVE`;

				return m.reply(text);
			}

			const team = args[0].toUpperCase();
			const list = members.filter(m => m.type === team);

			if (!list.length) {
				const teams = [...new Set(members.map(m => m.type))].join(", ");
				return m.reply(`❌ Tim ${team} tidak ditemukan\n\nTersedia: ${teams}`);
			}

			let text = `🎀 *Member Tim ${team}*\n\n`;

			list.forEach((mbr, i) => {
				text += `${i + 1}. ${mbr.name} (${mbr.nickname})\n`;
			});

			text += `\nTotal: ${list.length} member`;

			return m.reply(text);

		} catch (err) {
			console.error(err);
			m.reply("❌ Terjadi kesalahan saat memproses data");
		}
	}
};
