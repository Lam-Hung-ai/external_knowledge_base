"use client";

import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { KnowledgeWithFile } from "../knowledge.repository";
import { CreateKnowledgeDialog } from "./create-knowledge-dialog";
import { KnowledgeItem } from "./knowledge-item";

interface KnowledgeGroupProps {
  knowledges: KnowledgeWithFile[];
}

export function KnowledgeGroup({ knowledges }: KnowledgeGroupProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Knowledges</SidebarGroupLabel>

        <SidebarGroupAction
          onClick={() => setCreateOpen(true)}
          title="Thêm Knowledge Base"
          className="cursor-pointer"
        >
          <Plus className="size-4" />
          <span className="sr-only">Thêm Knowledge</span>
        </SidebarGroupAction>

        <SidebarMenu>
          {knowledges.length === 0 ? (
            <div className="px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              Chưa có base nào. Bấm &quot;+&quot; để thêm.
            </div>
          ) : (
            knowledges.map((knowledge) => (
              <KnowledgeItem key={knowledge.id} knowledge={knowledge} />
            ))
          )}
        </SidebarMenu>
      </SidebarGroup>

      <CreateKnowledgeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
}
