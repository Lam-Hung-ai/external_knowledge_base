import { relations } from "drizzle-orm/relations";
import {
	user,
	account,
	invitation,
	organization,
	member,
	session,
	chat,
	chatMessage,
	file,
	knowledgeFile,
	knowledge,
	chatFile,
} from "./schema";

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
	invitations: many(invitation),
	members: many(member),
	sessions: many(session),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id],
	}),
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id],
	}),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
	invitations: many(invitation),
	members: many(member),
}));

export const memberRelations = relations(member, ({ one }) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id],
	}),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
	chat: one(chat, {
		fields: [chatMessage.chatId],
		references: [chat.id],
	}),
}));

export const chatRelations = relations(chat, ({ many }) => ({
	chatMessages: many(chatMessage),
	chatFiles: many(chatFile),
}));

export const knowledgeFileRelations = relations(knowledgeFile, ({ one }) => ({
	file: one(file, {
		fields: [knowledgeFile.fileId],
		references: [file.id],
	}),
	knowledge: one(knowledge, {
		fields: [knowledgeFile.knowledgeId],
		references: [knowledge.id],
	}),
}));

export const fileRelations = relations(file, ({ many }) => ({
	knowledgeFiles: many(knowledgeFile),
	chatFiles: many(chatFile),
}));

export const knowledgeRelations = relations(knowledge, ({ many }) => ({
	knowledgeFiles: many(knowledgeFile),
}));

export const chatFileRelations = relations(chatFile, ({ one }) => ({
	chat: one(chat, {
		fields: [chatFile.chatId],
		references: [chat.id],
	}),
	file: one(file, {
		fields: [chatFile.fileId],
		references: [file.id],
	}),
}));
