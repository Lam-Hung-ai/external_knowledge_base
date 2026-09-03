"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/current-user";
import { deleteStoredFile, saveUserFile } from "@/lib/storage-utils";
import {
  createKnowledgeWithFile,
  deleteKnowledgeRecord,
  getKnowledgeById,
  type KnowledgeWithFile,
  listUserKnowledges,
  updateKnowledgeRecord,
} from "./knowledge.repository";

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isXlsxFile(file: File): boolean {
  const filename = file.name.toLowerCase();
  const validExtension = filename.endsWith(".xlsx");
  const validMime =
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/octet-stream" ||
    file.type === "";
  return validExtension && validMime;
}

export async function getKnowledgesAction(): Promise<KnowledgeWithFile[]> {
  try {
    return await listUserKnowledges();
  } catch (err) {
    console.error("Error fetching knowledges:", err);
    return [];
  }
}

export async function getKnowledgeAction(
  id: string,
): Promise<ActionResponse<KnowledgeWithFile>> {
  try {
    const knowledge = await getKnowledgeById(id);
    if (!knowledge) {
      return { success: false, error: "Không tìm thấy cơ sở tri thức." };
    }
    return { success: true, data: knowledge };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Lỗi khi tải thông tin knowledge.",
    };
  }
}

export async function createKnowledgeAction(
  formData: FormData,
): Promise<ActionResponse<KnowledgeWithFile>> {
  const user = await requireUser();

  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || "";
  const file = formData.get("file") as File | null;

  if (!name) {
    return { success: false, error: "Vui lòng nhập tên cho Knowledge Base." };
  }

  if (!file || file.size === 0) {
    return {
      success: false,
      error: "Vui lòng đính kèm một file Excel định dạng .xlsx.",
    };
  }

  if (!isXlsxFile(file)) {
    return {
      success: false,
      error: "Chỉ chấp nhận file Excel định dạng .xlsx.",
    };
  }

  let savedFilePath: string | null = null;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveUserFile(user.id, file.name, buffer);
    savedFilePath = saved.relativePath;

    const record = await createKnowledgeWithFile({
      name,
      description,
      fileInfo: {
        filename: file.name,
        path: saved.relativePath,
        hash: saved.hash,
        size: saved.size,
        mimeType: file.type,
      },
    });

    revalidatePath("/", "layout");
    return { success: true, data: record };
  } catch (error: any) {
    // If file was saved on disk but DB failed, clean up disk
    if (savedFilePath) {
      await deleteStoredFile(savedFilePath);
    }
    console.error("Error creating knowledge:", error);
    return {
      success: false,
      error: error.message || "Không thể tạo Knowledge Base. Vui lòng thử lại.",
    };
  }
}

export async function updateKnowledgeAction(
  formData: FormData,
): Promise<ActionResponse<KnowledgeWithFile>> {
  const user = await requireUser();

  const id = formData.get("id")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const file = formData.get("file") as File | null;

  if (!id) {
    return { success: false, error: "ID cơ sở tri thức không hợp lệ." };
  }

  if (!name) {
    return { success: false, error: "Tên cơ sở tri thức không được để trống." };
  }

  let newFileInfo:
    | {
        filename: string;
        path: string;
        hash: string;
        size: number;
        mimeType?: string;
      }
    | undefined;

  let savedNewFilePath: string | null = null;

  try {
    if (file && file.size > 0) {
      if (!isXlsxFile(file)) {
        return {
          success: false,
          error: "Chỉ chấp nhận file Excel định dạng .xlsx.",
        };
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const saved = await saveUserFile(user.id, file.name, buffer);
      savedNewFilePath = saved.relativePath;

      newFileInfo = {
        filename: file.name,
        path: saved.relativePath,
        hash: saved.hash,
        size: saved.size,
        mimeType: file.type,
      };
    }

    const { knowledge: updatedRecord, oldFilePathToDelete } =
      await updateKnowledgeRecord(id, {
        name,
        description: description ?? "",
        newFileInfo,
      });

    // If a new file was saved and there was an old file, delete the old file
    if (newFileInfo && oldFilePathToDelete) {
      await deleteStoredFile(oldFilePathToDelete);
    }

    revalidatePath("/", "layout");
    return { success: true, data: updatedRecord };
  } catch (error: any) {
    // If DB failed, clean up newly saved file
    if (savedNewFilePath) {
      await deleteStoredFile(savedNewFilePath);
    }
    console.error("Error updating knowledge:", error);
    return {
      success: false,
      error:
        error.message ||
        "Không thể cập nhật Knowledge Base. Vui lòng thử lại.",
    };
  }
}

export async function deleteKnowledgeAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { success, filePathToDelete } = await deleteKnowledgeRecord(id);

    if (!success) {
      return { success: false, error: "Không tìm thấy hoặc không thể xóa." };
    }

    if (filePathToDelete) {
      await deleteStoredFile(filePathToDelete);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting knowledge:", error);
    return {
      success: false,
      error: error.message || "Lỗi khi xóa Knowledge Base.",
    };
  }
}
