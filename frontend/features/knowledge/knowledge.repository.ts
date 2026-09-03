import "server-only";

import { db, file, knowledge, knowledgeFile } from "@/db";
import { requireUser } from "@/lib/current-user";
import { and, desc, eq } from "drizzle-orm";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type KnowledgeWithFile = {
  id: string;
  name: string | null;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  file: {
    id: string;
    filename: string | null;
    path: string | null;
    hash: string | null;
    meta: any;
    createdAt: string | null;
  } | null;
};

export async function listUserKnowledges({
  limit = 50,
}: { limit?: number } = {}): Promise<KnowledgeWithFile[]> {
  const user = await requireUser();

  const rows = await db
    .select({
      id: knowledge.id,
      name: knowledge.name,
      description: knowledge.description,
      createdAt: knowledge.createdAt,
      updatedAt: knowledge.updatedAt,
      fileId: file.id,
      fileFilename: file.filename,
      filePath: file.path,
      fileHash: file.hash,
      fileMeta: file.meta,
      fileCreatedAt: file.createdAt,
    })
    .from(knowledge)
    .leftJoin(knowledgeFile, eq(knowledge.id, knowledgeFile.knowledgeId))
    .leftJoin(file, eq(knowledgeFile.fileId, file.id))
    .where(eq(knowledge.userId, user.id))
    .orderBy(desc(knowledge.updatedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    file: row.fileId
      ? {
          id: row.fileId,
          filename: row.fileFilename,
          path: row.filePath,
          hash: row.fileHash,
          meta: row.fileMeta,
          createdAt: row.fileCreatedAt,
        }
      : null,
  }));
}

export async function getKnowledgeById(
  id: string,
): Promise<KnowledgeWithFile | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const user = await requireUser();

  const [row] = await db
    .select({
      id: knowledge.id,
      name: knowledge.name,
      description: knowledge.description,
      createdAt: knowledge.createdAt,
      updatedAt: knowledge.updatedAt,
      fileId: file.id,
      fileFilename: file.filename,
      filePath: file.path,
      fileHash: file.hash,
      fileMeta: file.meta,
      fileCreatedAt: file.createdAt,
    })
    .from(knowledge)
    .leftJoin(knowledgeFile, eq(knowledge.id, knowledgeFile.knowledgeId))
    .leftJoin(file, eq(knowledgeFile.fileId, file.id))
    .where(and(eq(knowledge.id, id), eq(knowledge.userId, user.id)))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    file: row.fileId
      ? {
          id: row.fileId,
          filename: row.fileFilename,
          path: row.filePath,
          hash: row.fileHash,
          meta: row.fileMeta,
          createdAt: row.fileCreatedAt,
        }
      : null,
  };
}

export async function createKnowledgeWithFile({
  name,
  description,
  fileInfo,
}: {
  name: string;
  description?: string;
  fileInfo: {
    filename: string;
    path: string;
    hash: string;
    size: number;
    mimeType?: string;
  };
}): Promise<KnowledgeWithFile> {
  const user = await requireUser();

  return db.transaction(async (tx) => {
    // 1. Insert knowledge
    const [newKnowledge] = await tx
      .insert(knowledge)
      .values({
        userId: user.id,
        name,
        description: description || null,
      })
      .returning();

    if (!newKnowledge) {
      throw new Error("KNOWLEDGE_CREATE_FAILED");
    }

    // 2. Insert file
    const [newFile] = await tx
      .insert(file)
      .values({
        userId: user.id,
        filename: fileInfo.filename,
        path: fileInfo.path,
        hash: fileInfo.hash,
        meta: {
          size: fileInfo.size,
          mimeType:
            fileInfo.mimeType ||
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      })
      .returning();

    if (!newFile) {
      throw new Error("FILE_CREATE_FAILED");
    }

    // 3. Link knowledge & file
    await tx.insert(knowledgeFile).values({
      userId: user.id,
      knowledgeId: newKnowledge.id,
      fileId: newFile.id,
    });

    return {
      id: newKnowledge.id,
      name: newKnowledge.name,
      description: newKnowledge.description,
      createdAt: newKnowledge.createdAt,
      updatedAt: newKnowledge.updatedAt,
      file: {
        id: newFile.id,
        filename: newFile.filename,
        path: newFile.path,
        hash: newFile.hash,
        meta: newFile.meta,
        createdAt: newFile.createdAt,
      },
    };
  });
}

export async function updateKnowledgeRecord(
  id: string,
  {
    name,
    description,
    newFileInfo,
  }: {
    name?: string;
    description?: string;
    newFileInfo?: {
      filename: string;
      path: string;
      hash: string;
      size: number;
      mimeType?: string;
    };
  },
): Promise<{
  knowledge: KnowledgeWithFile;
  oldFilePathToDelete?: string | null;
}> {
  if (!UUID_PATTERN.test(id)) {
    throw new Error("INVALID_ID");
  }

  const user = await requireUser();

  return db.transaction(async (tx) => {
    // Verify knowledge exists and belongs to user
    const [currentKnowledge] = await tx
      .select()
      .from(knowledge)
      .where(and(eq(knowledge.id, id), eq(knowledge.userId, user.id)))
      .limit(1);

    if (!currentKnowledge) {
      throw new Error("KNOWLEDGE_NOT_FOUND");
    }

    // Update knowledge fields
    const updateValues: Partial<typeof knowledge.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };
    if (name !== undefined) updateValues.name = name;
    if (description !== undefined) updateValues.description = description;

    const [updatedKnowledge] = await tx
      .update(knowledge)
      .set(updateValues)
      .where(and(eq(knowledge.id, id), eq(knowledge.userId, user.id)))
      .returning();

    let oldFilePathToDelete: string | null = null;
    let finalFileRecord: typeof file.$inferSelect | null = null;

    if (newFileInfo) {
      // Find existing file via knowledge_file
      const [existingLink] = await tx
        .select({
          fileId: knowledgeFile.fileId,
          filePath: file.path,
        })
        .from(knowledgeFile)
        .leftJoin(file, eq(knowledgeFile.fileId, file.id))
        .where(
          and(
            eq(knowledgeFile.knowledgeId, id),
            eq(knowledgeFile.userId, user.id),
          ),
        )
        .limit(1);

      if (existingLink) {
        oldFilePathToDelete = existingLink.filePath ?? null;

        // Delete old file record
        await tx.delete(file).where(eq(file.id, existingLink.fileId));
        // Also delete link if not cascaded
        await tx
          .delete(knowledgeFile)
          .where(eq(knowledgeFile.knowledgeId, id));
      }

      // Create new file record
      const [insertedFile] = await tx
        .insert(file)
        .values({
          userId: user.id,
          filename: newFileInfo.filename,
          path: newFileInfo.path,
          hash: newFileInfo.hash,
          meta: {
            size: newFileInfo.size,
            mimeType:
              newFileInfo.mimeType ||
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        })
        .returning();

      finalFileRecord = insertedFile;

      // Create new link
      await tx.insert(knowledgeFile).values({
        userId: user.id,
        knowledgeId: id,
        fileId: insertedFile.id,
      });
    } else {
      // Get current file
      const [existingFile] = await tx
        .select({
          id: file.id,
          filename: file.filename,
          path: file.path,
          hash: file.hash,
          meta: file.meta,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          userId: file.userId,
          data: file.data,
        })
        .from(knowledgeFile)
        .innerJoin(file, eq(knowledgeFile.fileId, file.id))
        .where(
          and(
            eq(knowledgeFile.knowledgeId, id),
            eq(knowledgeFile.userId, user.id),
          ),
        )
        .limit(1);

      finalFileRecord = existingFile ?? null;
    }

    return {
      knowledge: {
        id: updatedKnowledge.id,
        name: updatedKnowledge.name,
        description: updatedKnowledge.description,
        createdAt: updatedKnowledge.createdAt,
        updatedAt: updatedKnowledge.updatedAt,
        file: finalFileRecord
          ? {
              id: finalFileRecord.id,
              filename: finalFileRecord.filename,
              path: finalFileRecord.path,
              hash: finalFileRecord.hash,
              meta: finalFileRecord.meta,
              createdAt: finalFileRecord.createdAt,
            }
          : null,
      },
      oldFilePathToDelete,
    };
  });
}

export async function deleteKnowledgeRecord(
  id: string,
): Promise<{ success: boolean; filePathToDelete?: string | null }> {
  if (!UUID_PATTERN.test(id)) {
    return { success: false };
  }

  const user = await requireUser();

  return db.transaction(async (tx) => {
    // Find attached file
    const [existingLink] = await tx
      .select({
        fileId: knowledgeFile.fileId,
        filePath: file.path,
      })
      .from(knowledgeFile)
      .leftJoin(file, eq(knowledgeFile.fileId, file.id))
      .where(
        and(
          eq(knowledgeFile.knowledgeId, id),
          eq(knowledgeFile.userId, user.id),
        ),
      )
      .limit(1);

    const filePathToDelete = existingLink?.filePath ?? null;

    if (existingLink?.fileId) {
      await tx.delete(file).where(eq(file.id, existingLink.fileId));
    }

    // Delete knowledge (cascades knowledge_file)
    const [deleted] = await tx
      .delete(knowledge)
      .where(and(eq(knowledge.id, id), eq(knowledge.userId, user.id)))
      .returning({ id: knowledge.id });

    return {
      success: Boolean(deleted),
      filePathToDelete,
    };
  });
}
