export const SettingsSchema = {
	self: Boolean,
	groupOnly: Boolean,
	privateChatOnly: Boolean,
};

export const UserSchema = {
	name: String,
	limit: Number,
	premium: Boolean,
	premium_expired: Number,
	emails: Array,
	banned: Boolean,
	balance: Number,
	payloads: Object,
};

export const GroupSchema = {
	name: String,
	banned: Boolean,
};
