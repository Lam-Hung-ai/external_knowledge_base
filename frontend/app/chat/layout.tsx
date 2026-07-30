import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import ChatSidebar from "@/features/chat/components/chat-sidebar";

export default function ChatLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <ChatSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
