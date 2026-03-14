export default {
	name: "demote",
	description: "Demote admin group.",
	command: ["demote", "deladmin"],
	permissions: "admin",
	hidden: false,
	failed: "Failed to %command: %error",
	wait: null,
	category: "group",
	cooldown: 5,
	limit: false,
	usage: "$prefix$command reply or tag user.",
	react: true,
	botAdmin: true,
	group: true,
	private: false,
	owner: false,

	/**
	 * @param {import('baileys').WASocket} sock - The Baileys socket object.
	 * @param {object} m - The serialized message object.
	 */
	async execute(m, { sock, groupMetadata }) {
		const user = m?.quoted?.sender || m.mentions[0];
		if (!user) {
			return m.reply("Reply or tag a user");
		}

		await m.reply({
			text: `Demote @${user.replace(/[^0-9]/g, "")} to be admin at ${groupMetadata.subject}`,
			mentions: [user],
		});

		await sock
			.groupParticipantsUpdate(m.from, [user], "demote")
			.catch(() => {});
	},
};
