"use server";

import { revalidatePath } from "next/cache";
import { createChatRecord, touchChatRecord } from "./chat.repository";

type CreateChatResult =
  | { success: true; data: { id: string; title: string } }
  | { success: false; error: string };

const makeTitle = (firstMessage: string) =>
  firstMessage.trim().replace(/\s+/g, " ").split(" ").slice(0, 6).join(" ");

export async function createChat(
  firstMessage: string,
): Promise<CreateChatResult> {
  const title = makeTitle(firstMessage);

  if (!title) {
    return { success: false, error: "Vui lòng nhập câu hỏi." };
  }

  try {
    const record = await createChatRecord(title);
    revalidatePath("/", "layout");

    return {
      success: true,
      data: { id: record.id, title: record.title ?? title },
    };
  } catch {
    return {
      success: false,
      error: "Không thể tạo cuộc trò chuyện. Vui lòng thử lại.",
    };
  }
}

export async function touchChat(id: string) {
  try {
    const updated = await touchChatRecord(id);
    if (updated) {
      revalidatePath("/", "layout");
    }
    return updated;
  } catch {
    return false;
  }
}
