import { readFileSync } from "fs";

export default {
	name: "getplugin",
	description: "Send the source code of a plugin.",
	command: ["gp", "getplug", "getplugin", "getfeature"],
	permissions: "owner",
	hidden: false,
	failed: "Failed to execute %command: %error",
	wait: null,
	category: "owner",
	cooldown: 0,
	limit: false,
	usage: "$prefix$command <plugin-name/command>",
	react: true,
	botAdmin: false,
	group: false,
	private: false,
	owner: true,

	/**
	 * @param {import('baileys').WASocket} sock - The Baileys socket object.
	 * @param {object} m - The serialized message object.
	 * @param {object} plugins - The plugins object.
	 * @param {object} args - The arguments object.
	 */
	execute: async (m, { plugins, args }) => {
		if (!args.length) {
			const list = plugins
				.map((plg) => `- ${plg.name} (${plg.command.join(", ")})`)
				.join("\n");
			return m.reply(
				`Usage: *${m.prefix}${m.command} <plugin-name/command>*\n\nAvailable plugins:\n${list}`
			);
		}

		const query = args.join(" ").toLowerCase();

		let found = plugins.find(
			(plg) =>
				plg.name.toLowerCase() === query ||
				plg.command.some((cmd) => cmd.toLowerCase() === query)
		);

		if (!found) {
			const list = plugins
				.map(
					(plg) =>
						`- *${plg.name}* _(alias: ${plg.command.join(", ")})_`
				)
				.join("\n");
			return m.reply(
				`Plugin/command '${query}' not found!\n\nAvailable:\n${list}`
			);
		}

		await m.reply(readFileSync(found.filePath, "utf-8"));
	},
};
