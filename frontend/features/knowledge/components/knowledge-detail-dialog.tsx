"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Calendar,
  FileSpreadsheet,
  HardDrive,
  Pencil,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteKnowledgeAction,
  updateKnowledgeAction,
} from "../knowledge.actions";
import type { KnowledgeWithFile } from "../knowledge.repository";

interface KnowledgeDetailDialogProps {
  knowledge: KnowledgeWithFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  onUpdated?: (updated: KnowledgeWithFile) => void;
}

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleString("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dateStr;
  }
}

export function KnowledgeDetailDialog({
  knowledge,
  open,
  onOpenChange,
  onDeleted,
  onUpdated,
}: KnowledgeDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(knowledge.name || "");
  const [description, setDescription] = useState(knowledge.description || "");
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when knowledge changes
  useEffect(() => {
    setName(knowledge.name || "");
    setDescription(knowledge.description || "");
    setReplacementFile(null);
    setIsEditing(false);
    setShowDeleteConfirm(false);
  }, [knowledge, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Vui lòng chỉ chọn file Excel có định dạng .xlsx");
      e.target.value = "";
      return;
    }

    setReplacementFile(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Tên cơ sở tri thức không được để trống.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", knowledge.id);
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      if (replacementFile) {
        formData.append("file", replacementFile);
      }

      const result = await updateKnowledgeAction(formData);

      if (result.success) {
        toast.success("Cập nhật Knowledge Base thành công.");
        setIsEditing(false);
        setReplacementFile(null);
        onUpdated?.(result.data);
      } else {
        toast.error(result.error || "Không thể cập nhật.");
      }
    });
  };

  const handleDelete = () => {
    setIsDeleting(true);
    startTransition(async () => {
      const result = await deleteKnowledgeAction(knowledge.id);
      setIsDeleting(false);

      if (result.success) {
        toast.success(`Đã xóa Knowledge Base "${knowledge.name}"`);
        onOpenChange(false);
        onDeleted?.();
      } else {
        toast.error(result.error || "Không thể xóa Knowledge Base.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* DELETE CONFIRMATION STATE */}
        {showDeleteConfirm ? (
          <div className="flex flex-col gap-4 py-2">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                <DialogTitle>Xác nhận xóa Knowledge Base</DialogTitle>
              </div>
              <DialogDescription>
                Hành động này không thể hoàn tác. Toàn bộ thông tin base{" "}
                <strong className="text-foreground font-semibold">
                  {knowledge.name}
                </strong>{" "}
                và file Excel lưu trên ổ đĩa sẽ bị xóa vĩnh viễn.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4 flex sm:justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Spinner className="mr-2" />}
                Xác nhận xóa
              </Button>
            </DialogFooter>
          </div>
        ) : !isEditing ? (
          /* READ-ONLY VIEW MODE */
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                  <FileSpreadsheet className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="truncate">
                    {knowledge.name || "Untitled Knowledge"}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Tạo: {formatDate(knowledge.createdAt)} • Cập nhật:{" "}
                    {formatDate(knowledge.updatedAt)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Mô tả */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mô tả & Schema
              </span>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm min-h-[60px] whitespace-pre-wrap">
                {knowledge.description ? (
                  knowledge.description
                ) : (
                  <span className="text-muted-foreground italic text-xs">
                    Chưa có mô tả nào cho cơ sở tri thức này.
                  </span>
                )}
              </div>
            </div>

            {/* Thông tin File Excel */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                File dữ liệu Excel (.xlsx)
              </span>

              {knowledge.file ? (
                <div className="border rounded-lg p-3 bg-card flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded shrink-0">
                        <FileSpreadsheet className="size-4" />
                      </div>
                      <span className="text-sm font-medium truncate">
                        {knowledge.file.filename}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatBytes(knowledge.file.meta?.size || 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1 border-t text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1 truncate" title={knowledge.file.path || ""}>
                      <HardDrive className="size-3 shrink-0" />
                      <span className="truncate">{knowledge.file.path}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Không tìm thấy thông tin file đính kèm.
                </p>
              )}
            </div>

            <DialogFooter className="mt-2 flex sm:justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="size-4 mr-1.5" />
                Xóa base
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Đóng
                </Button>
                <Button type="button" onClick={() => setIsEditing(true)}>
                  <Pencil className="size-4 mr-1.5" />
                  Chỉnh sửa
                </Button>
              </div>
            </DialogFooter>
          </div>
        ) : (
          /* EDIT MODE */
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa Knowledge Base</DialogTitle>
              <DialogDescription>
                Cập nhật tên, mô tả hoặc thay thế file Excel cho agent DuckDB.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              {/* Tên base */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-knowledge-name">
                  Tên Base <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-knowledge-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              {/* Mô tả */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-knowledge-desc">
                  Mô tả file & dữ liệu
                </Label>
                <Textarea
                  id="edit-knowledge-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  placeholder="Mô tả các bảng tính, các cột dữ liệu..."
                />
              </div>

              {/* Thay thế file */}
              <div className="flex flex-col gap-1.5">
                <Label>File Excel (.xlsx)</Label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Current file notice */}
                {!replacementFile ? (
                  <div className="flex items-center justify-between p-2.5 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          Hiện tại: {knowledge.file?.filename || "Chưa có file"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isPending}
                    >
                      <Upload className="size-3.5 mr-1" />
                      Đổi file
                    </Button>
                  </div>
                ) : (
                  /* Newly picked replacement file */
                  <div className="flex items-center justify-between p-2.5 border border-primary/50 rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileSpreadsheet className="size-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-primary truncate">
                          File mới: {replacementFile.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatBytes(replacementFile.size)} (Sẽ thay thế file cũ)
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setReplacementFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      disabled={isPending}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-2 flex sm:justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
              >
                <Trash2 className="size-4 mr-1.5" />
                Xóa base
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setReplacementFile(null);
                    setName(knowledge.name || "");
                    setDescription(knowledge.description || "");
                  }}
                  disabled={isPending}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Spinner className="mr-2" />}
                  Lưu thay đổi
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
