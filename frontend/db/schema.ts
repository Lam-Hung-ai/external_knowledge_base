import { pgTable, unique, uuid, text, boolean, timestamp, index, foreignKey, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const user = pgTable("user", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const organization = pgTable("organization", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	logo: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	metadata: text(),
}, (table) => [
	unique("organization_slug_unique").on(table.slug),
]);

export const account = pgTable("account", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: uuid("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true, mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true, mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const invitation = pgTable("invitation", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	email: text().notNull(),
	role: text(),
	status: text().default('pending').notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	inviterId: uuid("inviter_id").notNull(),
}, (table) => [
	index("invitation_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("invitation_organizationId_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.inviterId],
			foreignColumns: [user.id],
			name: "invitation_inviter_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "invitation_organization_id_organization_id_fk"
		}).onDelete("cascade"),
]);

export const member = pgTable("member", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: text().default('member').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("member_organizationId_idx").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("member_userId_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "member_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "member_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: uuid("user_id").notNull(),
	activeOrganizationId: uuid("active_organization_id"),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const verification = pgTable("verification", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const knowledge = pgTable("knowledge", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	userId: uuid("user_id"),
	name: text(),
	description: text(),
	data: jsonb(),
	meta: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_knowledge_user_updated_at").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
]);

export const file = pgTable("file", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	userId: uuid("user_id"),
	hash: text(),
	filename: text(),
	path: text(),
	data: jsonb(),
	meta: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_file_hash").using("btree", table.hash.asc().nullsLast().op("text_ops")).where(sql`(hash IS NOT NULL)`),
	index("idx_file_user_created_at").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
]);

export const chat = pgTable("chat", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	userId: uuid("user_id"),
	title: text(),
	chat: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	shareId: text("share_id"),
	archived: boolean().default(false),
	pinned: boolean().default(false),
	meta: jsonb().default({}),
	folderId: uuid("folder_id"),
	tasks: jsonb(),
	summary: text(),
	lastReadAt: timestamp("last_read_at", { withTimezone: true, mode: 'string' }),
	currentMessageId: uuid("current_message_id"),
	variables: jsonb(),
}, (table) => [
	index("idx_chat_user_folder_updated_at").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.folderId.asc().nullsLast().op("timestamptz_ops"), table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_chat_user_pinned_updated_at").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.updatedAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`(pinned IS TRUE)`),
	index("idx_chat_user_updated_at").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.updatedAt.desc().nullsFirst().op("uuid_ops")),
	unique("chat_share_id_key").on(table.shareId),
]);

export const chatMessage = pgTable("chat_message", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	chatId: uuid("chat_id").notNull(),
	userId: uuid("user_id"),
	role: text().notNull(),
	parentId: uuid("parent_id"),
	content: jsonb(),
	output: jsonb(),
	modelId: text("model_id"),
	files: jsonb(),
	sources: jsonb(),
	embeds: jsonb(),
	meta: jsonb(),
	done: boolean().default(true),
	statusHistory: jsonb("status_history"),
	error: jsonb(),
	usage: jsonb(),
	contextSummary: text("context_summary"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_chat_message_chat_created_at").using("btree", table.chatId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("uuid_ops")),
	index("idx_chat_message_chat_parent").using("btree", table.chatId.asc().nullsLast().op("uuid_ops"), table.parentId.asc().nullsLast().op("uuid_ops")),
	index("idx_chat_message_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_chat_message_model_created_at").using("btree", table.modelId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_chat_message_user_created_at").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "fk_chat_message_chat"
		}).onDelete("cascade"),
]);

export const knowledgeFile = pgTable("knowledge_file", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	knowledgeId: uuid("knowledge_id").notNull(),
	fileId: uuid("file_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_knowledge_file_file_id").using("btree", table.fileId.asc().nullsLast().op("uuid_ops")),
	index("idx_knowledge_file_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.fileId],
			foreignColumns: [file.id],
			name: "fk_knowledge_file_file"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.knowledgeId],
			foreignColumns: [knowledge.id],
			name: "fk_knowledge_file_knowledge"
		}).onDelete("cascade"),
	unique("uq_knowledge_file_knowledge_file").on(table.knowledgeId, table.fileId),
]);

export const chatFile = pgTable("chat_file", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	chatId: uuid("chat_id").notNull(),
	fileId: uuid("file_id").notNull(),
	messageId: uuid("message_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_chat_file_file_id").using("btree", table.fileId.asc().nullsLast().op("uuid_ops")),
	index("idx_chat_file_message_id").using("btree", table.messageId.asc().nullsLast().op("uuid_ops")).where(sql`(message_id IS NOT NULL)`),
	index("idx_chat_file_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "fk_chat_file_chat"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fileId],
			foreignColumns: [file.id],
			name: "fk_chat_file_file"
		}).onDelete("cascade"),
	unique("uq_chat_file_chat_file").on(table.fileId, table.chatId),
]);
