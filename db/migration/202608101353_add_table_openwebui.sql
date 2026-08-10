-- ============================================================================
-- Open WebUI selected schema - PostgreSQL optimized edition
-- ============================================================================
-- Tables:
--   knowledge
--   file
--   chat
--   chat_message
--   knowledge_file
--   chat_file
--
-- Design goals:
--   1) Preserve the logical schema and DB-enforced relationships documented by
--      Open WebUI for these six tables.
--   2) Adapt storage and indexes for PostgreSQL.
--   3) Do NOT invent DB foreign keys for logical references that Open WebUI docs
--      do not declare as FKs.
--
-- PostgreSQL-specific choices:
--   * JSON -> JSONB
--   * IDs remain TEXT for Open WebUI compatibility/import friendliness
--   * epoch timestamps remain BIGINT for compatibility
--   * redundant B-tree indexes are removed when already covered by a UNIQUE or
--     left-prefix composite index
--   * a small set of practical PostgreSQL indexes is added for common list/read
--     access patterns; these are marked "POSTGRES OPTIMIZATION"
--
-- Logical references intentionally NOT promoted to FK constraints:
--   chat.current_message_id -> chat_message.id
--   chat_message.parent_id  -> chat_message.id
--   chat_file.message_id    -> associated chat message
--
-- user_id is not FK'd because the requested subset does not include user table.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. knowledge
-- ============================================================================

CREATE TABLE knowledge (
    id           TEXT PRIMARY KEY,
    user_id      TEXT,
    name         TEXT,
    description  TEXT,
    data         JSONB,
    meta         JSONB,
    created_at   BIGINT,
    updated_at   BIGINT
);

-- POSTGRES OPTIMIZATION:
-- Common owner-scoped listing ordered by most recently updated.
CREATE INDEX idx_knowledge_user_updated_at
    ON knowledge (user_id, updated_at DESC);


-- ============================================================================
-- 2. file
-- ============================================================================

CREATE TABLE file (
    id           TEXT PRIMARY KEY,
    user_id      TEXT,
    hash         TEXT,
    filename     TEXT,
    path         TEXT,
    data         JSONB,
    meta         JSONB,
    created_at   BIGINT,
    updated_at   BIGINT
);

-- POSTGRES OPTIMIZATION:
-- Common owner-scoped file listing.
CREATE INDEX idx_file_user_created_at
    ON file (user_id, created_at DESC);

-- POSTGRES OPTIMIZATION:
-- Useful for deduplication/cache-style lookups by checksum.
-- Not UNIQUE because the Open WebUI source schema does not declare hash unique.
CREATE INDEX idx_file_hash
    ON file (hash)
    WHERE hash IS NOT NULL;


-- ============================================================================
-- 3. chat
-- ============================================================================

CREATE TABLE chat (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT,
    title               TEXT,
    chat                JSONB,
    created_at          BIGINT,
    updated_at          BIGINT,
    share_id            TEXT UNIQUE,
    archived            BOOLEAN DEFAULT FALSE,
    pinned              BOOLEAN DEFAULT FALSE,

    -- Open WebUI documents meta as JSON metadata with server_default="".
    -- For PostgreSQL JSONB, an empty object is more query-friendly and matches
    -- the intended "metadata object" semantics better than a JSON string.
    meta                JSONB DEFAULT '{}'::jsonb,

    folder_id           TEXT,
    tasks               JSONB,
    summary             TEXT,
    last_read_at        BIGINT,
    current_message_id  TEXT,
    variables           JSONB
);

-- POSTGRES OPTIMIZATION:
-- Sidebar-style query:
--   WHERE user_id = ? ORDER BY updated_at DESC
CREATE INDEX idx_chat_user_updated_at
    ON chat (user_id, updated_at DESC);

-- POSTGRES OPTIMIZATION:
-- Folder-scoped chat listing.
CREATE INDEX idx_chat_user_folder_updated_at
    ON chat (user_id, folder_id, updated_at DESC);

-- POSTGRES OPTIMIZATION:
-- Efficient lookup of pinned chats for a user without indexing all rows.
CREATE INDEX idx_chat_user_pinned_updated_at
    ON chat (user_id, updated_at DESC)
    WHERE pinned IS TRUE;


-- ============================================================================
-- 4. chat_message
-- ============================================================================

CREATE TABLE chat_message (
    id               TEXT PRIMARY KEY,
    chat_id          TEXT NOT NULL,
    user_id          TEXT,
    role             TEXT NOT NULL,
    parent_id        TEXT,
    content          JSONB,
    output           JSONB,
    model_id         TEXT,
    files            JSONB,
    sources          JSONB,
    embeds           JSONB,
    meta             JSONB,
    done             BOOLEAN DEFAULT TRUE,
    status_history   JSONB,
    error            JSONB,
    usage            JSONB,
    context_summary  TEXT,
    created_at       BIGINT,
    updated_at       BIGINT,

    CONSTRAINT fk_chat_message_chat
        FOREIGN KEY (chat_id)
        REFERENCES chat(id)
        ON DELETE CASCADE
);

-- --------------------------------------------------------------------------
-- INDEXES DOCUMENTED BY OPEN WEBUI
-- --------------------------------------------------------------------------

-- Open WebUI documents user_id as indexed and also documents
-- (user_id, created_at). In PostgreSQL the composite index covers queries on
-- user_id alone, so a separate user_id-only index would be redundant.
CREATE INDEX idx_chat_message_user_created_at
    ON chat_message (user_id, created_at);

-- Same reasoning for model_id: (model_id, created_at) covers model_id-only
-- predicates due to the B-tree left-prefix rule.
CREATE INDEX idx_chat_message_model_created_at
    ON chat_message (model_id, created_at);

-- created_at is also documented as individually indexed; this is not covered
-- when it appears as the second column of the two composite indexes above.
CREATE INDEX idx_chat_message_created_at
    ON chat_message (created_at);

-- Branch/tree access pattern explicitly documented by Open WebUI.
CREATE INDEX idx_chat_message_chat_parent
    ON chat_message (chat_id, parent_id);

-- --------------------------------------------------------------------------
-- POSTGRES OPTIMIZATION
-- --------------------------------------------------------------------------

-- Most common chronological conversation read:
--   WHERE chat_id = ? ORDER BY created_at
--
-- (chat_id, parent_id) is good for branch traversal, but does not efficiently
-- provide created_at ordering, so this additional index is intentionally kept.
CREATE INDEX idx_chat_message_chat_created_at
    ON chat_message (chat_id, created_at);


-- ============================================================================
-- 5. knowledge_file
-- ============================================================================

CREATE TABLE knowledge_file (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL,
    knowledge_id  TEXT NOT NULL,
    file_id       TEXT NOT NULL,
    created_at    BIGINT NOT NULL,
    updated_at    BIGINT NOT NULL,

    CONSTRAINT fk_knowledge_file_knowledge
        FOREIGN KEY (knowledge_id)
        REFERENCES knowledge(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_knowledge_file_file
        FOREIGN KEY (file_id)
        REFERENCES file(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_knowledge_file_knowledge_file
        UNIQUE (knowledge_id, file_id)
);

-- Open WebUI documents indexes on knowledge_id, file_id, user_id.
--
-- PostgreSQL optimization:
-- UNIQUE(knowledge_id, file_id) already creates a B-tree whose left prefix is
-- knowledge_id, so a separate knowledge_id index is redundant and omitted.

CREATE INDEX idx_knowledge_file_file_id
    ON knowledge_file (file_id);

CREATE INDEX idx_knowledge_file_user_id
    ON knowledge_file (user_id);


-- ============================================================================
-- 6. chat_file
-- ============================================================================

CREATE TABLE chat_file (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    chat_id     TEXT NOT NULL,
    file_id     TEXT NOT NULL,
    message_id  TEXT,
    created_at  BIGINT NOT NULL,
    updated_at  BIGINT NOT NULL,

    CONSTRAINT fk_chat_file_chat
        FOREIGN KEY (chat_id)
        REFERENCES chat(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_chat_file_file
        FOREIGN KEY (file_id)
        REFERENCES file(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_chat_file_chat_file
        UNIQUE (chat_id, file_id)
);

-- Open WebUI documents indexes on chat_id, file_id, message_id, user_id.
--
-- PostgreSQL optimization:
-- UNIQUE(chat_id, file_id) already covers chat_id-only predicates, so a
-- separate chat_id index is redundant and omitted.

CREATE INDEX idx_chat_file_file_id
    ON chat_file (file_id);

CREATE INDEX idx_chat_file_message_id
    ON chat_file (message_id)
    WHERE message_id IS NOT NULL;

CREATE INDEX idx_chat_file_user_id
    ON chat_file (user_id);


COMMIT;


-- ============================================================================
-- RELATIONSHIP SUMMARY
-- ============================================================================
--
-- DB-enforced relationships preserved from Open WebUI docs:
--
--   knowledge 1 ---- N knowledge_file
--      knowledge_file.knowledge_id -> knowledge.id ON DELETE CASCADE
--
--   file 1 --------- N knowledge_file
--      knowledge_file.file_id -> file.id ON DELETE CASCADE
--
--   chat 1 --------- N chat_message
--      chat_message.chat_id -> chat.id ON DELETE CASCADE
--
--   chat 1 --------- N chat_file
--      chat_file.chat_id -> chat.id ON DELETE CASCADE
--
--   file 1 --------- N chat_file
--      chat_file.file_id -> file.id ON DELETE CASCADE
--
-- Logical references kept as plain TEXT to mirror Open WebUI behavior:
--
--   chat.current_message_id -> chat_message.id
--   chat_message.parent_id  -> chat_message.id
--   chat_file.message_id    -> chat_message.id (logical association)
--
-- ============================================================================
-- OPTIONAL JSONB INDEXES - DO NOT ENABLE UNTIL QUERY PATTERNS JUSTIFY THEM
-- ============================================================================
--
-- JSONB is used intentionally, but blanket GIN indexes are not created because
-- they increase write cost and storage. Add only when you actually filter using
-- JSONB operators such as @>, ?, ?&, ?|.
--
-- Examples:
--
-- CREATE INDEX idx_chat_message_sources_gin
--     ON chat_message USING GIN (sources jsonb_path_ops);
--
-- CREATE INDEX idx_chat_message_meta_gin
--     ON chat_message USING GIN (meta jsonb_path_ops);
--
-- CREATE INDEX idx_knowledge_meta_gin
--     ON knowledge USING GIN (meta jsonb_path_ops);
--
-- CREATE INDEX idx_file_meta_gin
--     ON file USING GIN (meta jsonb_path_ops);
--
-- ============================================================================
