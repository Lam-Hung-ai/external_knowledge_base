import { db, chat } from "@/db";
import { eq, desc } from "drizzle-orm";
import { requireUser } from "@/lib/current-user";

export async function listAllChats({ limit = 10 }: { limit?: number }) {
  try {
    const user = await requireUser();
    const chats = await db
      .select()
      .from(chat)
      .where(eq(chat.userId, user.id))
      .orderBy(desc(chat.createdAt))
      .limit(limit);
    return { success: true, data: chats };
  } catch {
    return {
      success: false,
      code: "INTERNAL_ERROR",
    };
  }
}
