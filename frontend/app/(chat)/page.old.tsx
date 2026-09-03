"use client";
import { Logo } from "@/components/logo/logo";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DatabasePlus, X, Plus, Database, ArrowUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
type VectorDB = {
  id: string;
  name: string;
};
const vectorDatabases: Array<VectorDB> = [
  { id: "1212", name: "Chinh sach" },
  { id: "111", name: "FAQ" },
  { id: "112", name: "FAQ2" },
  { id: "113", name: "FAQ3" },
  { id: "114", name: "FAQ4" },
  { id: "115", name: "FAQ5" },
  { id: "116", name: "FAQ6" },
  { id: "117", name: "FAQ7" },
  { id: "118", name: "FAQ8" },
  { id: "119", name: "FAQ9" },
  { id: "110", name: "FAQ10" },
];
export default function Chat() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedVectorDBs, setSelectedVectorDBs] = useState<Array<VectorDB>>(
    [],
  );
  const [humanMessage, setHumanMessage] = useState<string>("");
  const canChat =
    humanMessage.trim().length > 0 && selectedVectorDBs.length > 0;
  const addVectorDB = (vectorDB: VectorDB) => {
    setSelectedVectorDBs((current) =>
      current.some((db) => db.id === vectorDB.id)
        ? current
        : [vectorDB, ...current],
    );
  };
  const removeVectorDB = (vectorDB: VectorDB) => {
    setSelectedVectorDBs((current) => {
      return current.filter((value) => value.id != vectorDB.id);
    });
  };

  return (
    <div className="flex flex-col gap-2 size-full min-h-0 items-center justify-center ">
      <Logo className="text-xl md:text-2xl" />
      <div className="max-w-2xl w-full border rounded-2xl shadow-md hover:shadow-lg px-3 pb-3 pt-1 ">
        <div className="flex flex-wrap items-center justify-start gap-2 text-sm ">
          {selectedVectorDBs.map((vectorDatabase) => {
            return (
              <div
                key={vectorDatabase.id}
                className="relative flex items-center gap-2 rounded-xl bg-gray-200 pl-2 pb-2 pt-2 pr-5"
              >
                <Database className="size-4" />
                <span>{vectorDatabase.name}</span>
                <Button
                  className="absolute size-3 top-0 right-0 p-2 rounded-full bg-gray-900"
                  onClick={() => removeVectorDB(vectorDatabase)}
                >
                  <X color="white" />
                </Button>
              </div>
            );
          })}
        </div>
        <Textarea
          className="resize-none rounded-2xl min-h-20 max-h-56 focus-visible:ring-0 border-none"
          placeholder="What is your question?"
          onChange={(e) => setHumanMessage(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full cursor-pointer"
                      />
                    }
                  />
                }
              >
                <Plus
                  className={cn(
                    "size-5 transition-transform duration-300 ease-out",
                    isOpen ? "rotate-45" : "rotate-0",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>Import your vector databases</TooltipContent>
            </Tooltip>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex gap-2 items-center justify-start ">
                  <DatabasePlus className="size-4" />
                  Vector databases
                </DropdownMenuLabel>
                {vectorDatabases.map((value) => (
                  <DropdownMenuItem
                    closeOnClick={false}
                    key={value.id}
                    onClick={() => addVectorDB(value)}
                  >
                    {value.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip disabled={canChat}>
            <TooltipTrigger
              render={
                <span className="inline-block cursor-not-allowed">
                  <Button
                    className="rounded-full p-2 size-10 cursor-pointer"
                    disabled={!canChat}
                  >
                    <ArrowUp color="white" className="size-4.5" />
                  </Button>
                </span>
              }
            />
            <TooltipContent>
              Please import a vector database and enter your question
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
