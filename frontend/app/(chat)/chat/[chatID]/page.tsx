import { ChatWorkspace } from "@/features/chat/components/chat-workspace";
import { getChatById } from "@/features/chat/chat.repository";
import { notFound } from "next/navigation";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatID: string }>;
}) {
  const { chatID } = await params;
  const chat = await getChatById(chatID);

  if (!chat) {
    notFound();
  }

  return <ChatWorkspace threadId={chat.id} title={chat.title} />;
}
