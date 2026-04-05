async function bypassCF() {
	try {
		const url = new URL("https://kyuurzy.dev/tools/turnstile-min");
		url.searchParams.append("url", "https://am.api888.dev");
		url.searchParams.append("siteKey", "0x4AAAAAACLTsFnkWuzV5cB-");

		const response = await fetch(url.toString(), {
			signal: AbortSignal.timeout(30000),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.token;
	} catch (error) {
		console.error("BYPASS CF ERROR", error.message);
		throw new Error("Gagal bypass Cloudflare");
	}
}

async function verifyAMEmail(email) {
	const turnstileToken = await bypassCF();
	console.log(
		`[VERIFY] Turnstile token obtained: ${turnstileToken?.substring(0, 50)}...`
	);

	const response = await fetch(
		"https://am.api888.dev/api/license/verify-email",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Language": "id",
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
				"Accept": "application/json, text/plain, */*",
				"Origin": "https://am.api888.dev",
				"Referer": "https://am.api888.dev/"
			},
			body: JSON.stringify({
				email: email,
				turnstileToken: turnstileToken,
			}),
			signal: AbortSignal.timeout(30000),
		}
	);

	let data;
	try {
		data = await response.json();
	} catch (err) {
		throw new Error(`Diblokir Cloudflare (Status: ${response.status})`);
	}

	if (!response.ok) {
		throw new Error(data.message || `Gagal verifikasi (Status: ${response.status})`);
	}

	return data;
}

async function activateAMLicense(email, oobCode) {
	const response = await fetch(
		"https://am.api888.dev/api/license/activate",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Language": "id",
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
				"Accept": "application/json, text/plain, */*",
				"Origin": "https://am.api888.dev",
				"Referer": "https://am.api888.dev/"
			},
			body: JSON.stringify({
				email: email,
				oobCode: oobCode,
			}),
			signal: AbortSignal.timeout(30000),
		}
	);

	let data;
	try {
		data = await response.json();
	} catch (err) {
		throw new Error(`Diblokir Cloudflare (Status: ${response.status})`);
	}

	if (!response.ok) {
		throw new Error(data.message || `Gagal aktivasi (Status: ${response.status})`);
	}

	return data;
}


function extractOobCode(input) {
	const match = input.match(/oobCode%3D([^%&]+)/);
	if (match) {
		return match[1];
	}
	const directMatch = input.match(/[A-Za-z0-9_-]{50,}/);
	if (directMatch) {
		return directMatch[0];
	}
	return input.trim();
}

export default {
	name: "Alight Motion",
	description: "Verify and activate Alight Motion Pro license.",
	command: ["alightmotion", "am"],
	permissions: "all",
	hidden: false,
	failed: "Failed to %command: %error",
	wait: "Sedang memproses, tunggu sebentar...",
	category: "tools",
	cooldown: 5,
	limit: true,
	usage: "$prefix$command <verify/activate> <email> [oobCode/link]",
	react: true,
	botAdmin: false,
	group: false,
	private: false,
	owner: false,

		execute: async (m) => {
		const text = m.text || m.body || "";
		let args = text.trim().split(/ +/);

		if (args.length > 0 && /^[^\w\s]*(am|alightmotion)$/i.test(args[0])) {
			args.shift();
		}

		const action = args[0]?.toLowerCase();
		const email = args[1];

		if (!action || !["verify", "activate"].includes(action)) {
			return m.reply(
				`*Format Salah!*\n\n*Cara Penggunaan:*\n1. Verifikasi Email: \`\`\`!am verify <email>\`\`\`\n2. Aktivasi Lisensi: \`\`\`!am activate <email> <link/oobCode>\`\`\``
			);
		}

		if (!email) {
			return m.reply("Harap masukkan alamat email yang valid.\nContoh: `!am verify test@gmail.com`");
		}

		if (action === "verify") {
			try {
				const result = await verifyAMEmail(email);
				return m.reply(
					`*VERIFIKASI BERHASIL*\n\nStatus: ${result.message || "Sukses dikirim!"}\n\nSilakan cek inbox/spam di email \`${email}\` untuk mendapatkan link aktivasi atau oobCode. Jika sudah, lanjutkan dengan perintah \`activate\`.`
				);
			} catch (error) {
				return m.reply(`*VERIFIKASI GAGAL*\n\nTerjadi kesalahan: \`${error.message}\``);
			}
		}

		if (action === "activate") {
			const rawOob = args[2];
			
			if (!rawOob) {
				return m.reply(
					"Harap sertakan link aktivasi atau oobCode yang kamu dapatkan dari email.\nContoh: `!am activate test@gmail.com https://link...`"
				);
			}

			try {
				const oobCode = extractOobCode(rawOob);
				const result = await activateAMLicense(email, oobCode);
				return m.reply(
					`*AKTIVASI BERHASIL*\n\nStatus: ${result.message || "Lisensi berhasil diaktifkan!"}\nEmail: \`${email}\``
				);
			} catch (error) {
				return m.reply(`*AKTIVASI GAGAL*\n\nTerjadi kesalahan: \`${error.message}\``);
			}
		}
	},
};
