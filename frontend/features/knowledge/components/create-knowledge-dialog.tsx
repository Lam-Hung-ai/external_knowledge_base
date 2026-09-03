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
import { FileSpreadsheet, Upload, X } from "lucide-react";
import React, { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createKnowledgeAction } from "../knowledge.actions";

interface CreateKnowledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function CreateKnowledgeDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateKnowledgeDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Vui lòng chỉ chọn file Excel có định dạng .xlsx");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    if (!name) {
      // Auto fill name with file basename if empty
      const base = file.name.replace(/\.[^/.]+$/, "");
      setName(base);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Vui lòng chỉ chọn file Excel có định dạng .xlsx");
      return;
    }

    setSelectedFile(file);
    if (!name) {
      const base = file.name.replace(/\.[^/.]+$/, "");
      setName(base);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Vui lòng nhập tên cho Knowledge Base.");
      return;
    }

    if (!selectedFile) {
      toast.error("Vui lòng chọn 1 file Excel (.xlsx).");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("file", selectedFile);

      const result = await createKnowledgeAction(formData);

      if (result.success) {
        toast.success(`Đã tạo cơ sở tri thức "${result.data.name}"`);
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Không thể tạo Knowledge Base.");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Thêm Knowledge Base mới</DialogTitle>
            <DialogDescription>
              Mỗi Knowledge liên kết với 1 file Excel (.xlsx) để agent DuckDB
              truy vấn dữ liệu.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {/* Tên base */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="knowledge-name">
                Tên Base <span className="text-destructive">*</span>
              </Label>
              <Input
                id="knowledge-name"
                placeholder="Ví dụ: Báo cáo kinh doanh 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                required
              />
            </div>

            {/* Mô tả file / base */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="knowledge-desc">
                Mô tả file & dữ liệu{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (Khuyên dùng cho DuckDB Agent)
                </span>
              </Label>
              <Textarea
                id="knowledge-desc"
                placeholder="Mô tả các bảng tính (sheets), các cột dữ liệu chính, định dạng dữ liệu để agent SQL hiểu và truy vấn chính xác..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
              />
            </div>

            {/* Upload File Excel */}
            <div className="flex flex-col gap-1.5">
              <Label>
                File Excel (.xlsx) <span className="text-destructive">*</span>
              </Label>

              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-primary/50 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <Upload className="size-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">
                    Nhấn để chọn file hoặc kéo thả vào đây
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Định dạng .xlsx (Tối đa 1 file)
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md shrink-0">
                      <FileSpreadsheet className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(selectedFile.size)}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Xóa file</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending || !selectedFile}>
              {isPending && <Spinner className="mr-2" />}
              Tạo Knowledge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
