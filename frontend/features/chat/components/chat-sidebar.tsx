import { Logo } from "@/components/logo/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth-session";
import { MessageCircle, MessageCirclePlus } from "lucide-react";
import Link from "next/link";

export default async function ChatSidebar() {
  const chats = Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    title: `Đoạn chat ${index + 1}`,
  }));
  const session = await getSession();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* Logo */}
        <div className="flex items-center justify-between">
          <Logo />
          <SidebarTrigger />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/" />} tooltip="New chat">
              <MessageCirclePlus className="shrink-0" />

              <span className="group-data-[collapsible=icon]:hidden">
                New chat
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>

          <SidebarMenu>
            {chats.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton
                  render={<Link href={`/chat/${chat.id}`} />}
                  tooltip={chat.title}
                >
                  <MessageCircle className="shrink-0" />

                  <span className="group-data-[collapsible=icon]:hidden">
                    {chat.title}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Nguyen Van Lam Hung">
              <Avatar className="size-8 shrink-0 rounded-lg">
                <AvatarImage
                  src={session?.user?.image || ""}
                  alt={session?.user?.name || ""}
                />
                <AvatarFallback>{session?.user?.name || "ND"}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-sm font-medium">
                  {session?.user?.name || "Not defined"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
