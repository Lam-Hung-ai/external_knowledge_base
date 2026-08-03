import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ChatSidebar from "@/features/chat/components/chat-sidebar";

export default function ChatLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <ChatSidebar />
      <SidebarInset className="h-full min-h-0 min-w-0 overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
