-- PostgreSQL 18 provides uuidv7() natively.
--
-- The previous schema stored application timestamps in two forms:
--   * timestamp without time zone (interpreted here as UTC)
--   * BIGINT Unix epoch seconds (Open WebUI tables)
--
-- This migration intentionally leaves external identifiers such as account_id,
-- provider_id, model_id and share_id as TEXT.

BEGIN;

-- Foreign keys must be removed while both sides are changed from TEXT to UUID.
ALTER TABLE account DROP CONSTRAINT account_user_id_user_id_fk;
ALTER TABLE invitation DROP CONSTRAINT invitation_inviter_id_user_id_fk;
ALTER TABLE invitation DROP CONSTRAINT invitation_organization_id_organization_id_fk;
ALTER TABLE member DROP CONSTRAINT member_organization_id_organization_id_fk;
ALTER TABLE member DROP CONSTRAINT member_user_id_user_id_fk;
ALTER TABLE session DROP CONSTRAINT session_user_id_user_id_fk;
ALTER TABLE chat_file DROP CONSTRAINT fk_chat_file_chat;
ALTER TABLE chat_file DROP CONSTRAINT fk_chat_file_file;
ALTER TABLE chat_message DROP CONSTRAINT fk_chat_message_chat;
ALTER TABLE knowledge_file DROP CONSTRAINT fk_knowledge_file_file;
ALTER TABLE knowledge_file DROP CONSTRAINT fk_knowledge_file_knowledge;

ALTER TABLE "user"
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE organization
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE account
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
    ALTER COLUMN access_token_expires_at TYPE TIMESTAMPTZ
        USING access_token_expires_at AT TIME ZONE 'UTC',
    ALTER COLUMN refresh_token_expires_at TYPE TIMESTAMPTZ
        USING refresh_token_expires_at AT TIME ZONE 'UTC',
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE invitation
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN organization_id TYPE UUID USING organization_id::uuid,
    ALTER COLUMN inviter_id TYPE UUID USING inviter_id::uuid,
    ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC',
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

ALTER TABLE member
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN organization_id TYPE UUID USING organization_id::uuid,
    ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE session
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
    ALTER COLUMN active_organization_id TYPE UUID USING active_organization_id::uuid,
    ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC',
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE verification
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC',
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE knowledge
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING to_timestamp(created_at),
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING to_timestamp(updated_at),
    ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE file
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING to_timestamp(created_at),
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING to_timestamp(updated_at),
    ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE chat
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
    ALTER COLUMN folder_id TYPE UUID USING folder_id::uuid,
    ALTER COLUMN current_message_id TYPE UUID USING current_message_id::uuid,
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING to_timestamp(created_at),
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING to_timestamp(updated_at),
    ALTER COLUMN updated_at SET DEFAULT now(),
    ALTER COLUMN last_read_at TYPE TIMESTAMPTZ USING to_timestamp(last_read_at);

ALTER TABLE chat_message
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN chat_id TYPE UUID USING chat_id::uuid,
    ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
    ALTER COLUMN parent_id TYPE UUID USING parent_id::uuid,
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING to_timestamp(created_at),
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING to_timestamp(updated_at),
    ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE knowledge_file
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
    ALTER COLUMN knowledge_id TYPE UUID USING knowledge_id::uuid,
    ALTER COLUMN file_id TYPE UUID USING file_id::uuid,
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING to_timestamp(created_at),
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING to_timestamp(updated_at),
    ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE chat_file
    ALTER COLUMN id TYPE UUID USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuidv7(),
    ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
    ALTER COLUMN chat_id TYPE UUID USING chat_id::uuid,
    ALTER COLUMN file_id TYPE UUID USING file_id::uuid,
    ALTER COLUMN message_id TYPE UUID USING message_id::uuid,
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING to_timestamp(created_at),
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING to_timestamp(updated_at),
    ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE account
    ADD CONSTRAINT account_user_id_user_id_fk
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE invitation
    ADD CONSTRAINT invitation_inviter_id_user_id_fk
    FOREIGN KEY (inviter_id) REFERENCES "user"(id) ON DELETE CASCADE,
    ADD CONSTRAINT invitation_organization_id_organization_id_fk
    FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE;

ALTER TABLE member
    ADD CONSTRAINT member_organization_id_organization_id_fk
    FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    ADD CONSTRAINT member_user_id_user_id_fk
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE session
    ADD CONSTRAINT session_user_id_user_id_fk
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE chat_file
    ADD CONSTRAINT fk_chat_file_chat
    FOREIGN KEY (chat_id) REFERENCES chat(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_chat_file_file
    FOREIGN KEY (file_id) REFERENCES file(id) ON DELETE CASCADE;

ALTER TABLE chat_message
    ADD CONSTRAINT fk_chat_message_chat
    FOREIGN KEY (chat_id) REFERENCES chat(id) ON DELETE CASCADE;

ALTER TABLE knowledge_file
    ADD CONSTRAINT fk_knowledge_file_file
    FOREIGN KEY (file_id) REFERENCES file(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_knowledge_file_knowledge
    FOREIGN KEY (knowledge_id) REFERENCES knowledge(id) ON DELETE CASCADE;

COMMIT;
