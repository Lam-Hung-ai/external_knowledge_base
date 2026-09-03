import "server-only";

import { chat, db } from "@/db";
import { requireUser } from "@/lib/current-user";
import { and, desc, eq, isNull, or } from "drizzle-orm";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function listAllChats({ limit = 10 }: { limit?: number }) {
  const user = await requireUser();

  return db
    .select()
    .from(chat)
    .where(
      and(
        eq(chat.userId, user.id),
        or(eq(chat.archived, false), isNull(chat.archived)),
      ),
    )
    .orderBy(desc(chat.updatedAt))
    .limit(limit);
}

export async function getChatById(id: string) {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const user = await requireUser();
  const [record] = await db
    .select()
    .from(chat)
    .where(and(eq(chat.id, id), eq(chat.userId, user.id)))
    .limit(1);

  return record ?? null;
}

export async function createChatRecord(title: string) {
  const user = await requireUser();
  const [record] = await db
    .insert(chat)
    .values({
      userId: user.id,
      title,
      meta: { assistantId: "my_agent", historySource: "langgraph" },
    })
    .returning({ id: chat.id, title: chat.title });

  if (!record) {
    throw new Error("CHAT_CREATE_FAILED");
  }

  return record;
}

export async function touchChatRecord(id: string) {
  if (!UUID_PATTERN.test(id)) {
    return false;
  }

  const user = await requireUser();
  const [record] = await db
    .update(chat)
    .set({ updatedAt: new Date().toISOString() })
    .where(and(eq(chat.id, id), eq(chat.userId, user.id)))
    .returning({ id: chat.id });

  return Boolean(record);
}
