export default {
	name: "join",
	description: "Join WhatsApp group via invite link",
	command: ["join", "addgroup"],
	permissions: "owner",
	hidden: false,
	failed: "Failed to %command: %error",
	wait: null,
	category: "owner",
	cooldown: 3,
	limit: false,
	usage: "$prefix$command <group link>",
	react: true,
	botAdmin: false,
	group: false,
	private: false,
	owner: true,

	/**
	 * @param {import('baileys').WASocket} sock
	 * @param {object} m
	 */
	async execute(m, { sock, text }) {
		if (!text) {
			return m.reply(
				"Please provide a WhatsApp group invite link.\n\nExample:\n.join https://chat.whatsapp.com/xxxx"
			);
		}

		const match = text.match(
			/https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/
		);
		if (!match) {
			return m.reply("Invalid WhatsApp group link.");
		}

		const inviteCode = match[1];

		try {
			const groupId = await sock.groupAcceptInvite(inviteCode);
			m.reply(`Successfully joined the group.\nGroup ID: ${groupId}`);
		} catch (err) {
			console.error("Join error:", err);
			m.reply(
				"Failed to join the group.\nThe link may be invalid, expired, or the bot is already removed."
			);
		}
	},
};
