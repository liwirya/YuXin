export default {
	name: "deletemessage",
	description: "Delete message.",
	command: ["del", "delete"],
	permissions: "all",
	hidden: false,
	failed: "Failed to %command: %error",
	wait: null,
	category: "misc",
	cooldown: 5,
	limit: false,
	usage: "$prefix$command <reply_message>",
	react: false,
	botAdmin: false,
	group: false,
	private: false,
	owner: false,

	/**
	 * @param {import('baileys').WASocket} sock - The Baileys socket object.
	 * @param {object} m - The serialized message object.
	 */
	execute: async (m, { isAdmin, isOwner, isBotAdmin }) => {
		if (m.quoted) {
			if (
				m.isGroup &&
				(isAdmin || isOwner) &&
				isBotAdmin &&
				!m.quoted.fromMe
			) {
				return m.quoted.delete();
			}
			m.quoted.delete();
		}
	},
};
