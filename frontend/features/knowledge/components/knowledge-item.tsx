"use client";

import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import type { KnowledgeWithFile } from "../knowledge.repository";
import { KnowledgeDetailDialog } from "./knowledge-detail-dialog";

interface KnowledgeItemProps {
  knowledge: KnowledgeWithFile;
}

export function KnowledgeItem({ knowledge }: KnowledgeItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SidebarMenuItem key={knowledge.id}>
        <SidebarMenuButton
          onClick={() => setOpen(true)}
          tooltip={knowledge.name || "Untitled knowledge"}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="group-data-[collapsible=icon]:hidden truncate">
            {knowledge.name || "Untitled knowledge"}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <KnowledgeDetailDialog
        knowledge={knowledge}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
