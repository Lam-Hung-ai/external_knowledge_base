CREATE TABLE account (
    id uuid DEFAULT uuidv7() NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp with time zone,
    refresh_token_expires_at timestamp with time zone,
    scope text,
    password text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE chat (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id uuid,
    title text,
    chat jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    share_id text,
    archived boolean DEFAULT false,
    pinned boolean DEFAULT false,
    meta jsonb DEFAULT '{}'::jsonb,
    folder_id uuid,
    tasks jsonb,
    summary text,
    last_read_at timestamp with time zone,
    current_message_id uuid,
    variables jsonb
);

CREATE TABLE chat_file (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id uuid NOT NULL,
    chat_id uuid NOT NULL,
    file_id uuid NOT NULL,
    message_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE chat_message (
    id uuid DEFAULT uuidv7() NOT NULL,
    chat_id uuid NOT NULL,
    user_id uuid,
    role text NOT NULL,
    parent_id uuid,
    content jsonb,
    output jsonb,
    model_id text,
    files jsonb,
    sources jsonb,
    embeds jsonb,
    meta jsonb,
    done boolean DEFAULT true,
    status_history jsonb,
    error jsonb,
    usage jsonb,
    context_summary text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE checkpoint_blobs (
    thread_id text NOT NULL,
    checkpoint_ns text DEFAULT ''::text NOT NULL,
    channel text NOT NULL,
    version text NOT NULL,
    type text NOT NULL,
    blob bytea
);

CREATE TABLE checkpoint_migrations (
    v integer NOT NULL
);

CREATE TABLE checkpoint_writes (
    thread_id text NOT NULL,
    checkpoint_ns text DEFAULT ''::text NOT NULL,
    checkpoint_id text NOT NULL,
    task_id text NOT NULL,
    idx integer NOT NULL,
    channel text NOT NULL,
    type text,
    blob bytea NOT NULL,
    task_path text DEFAULT ''::text NOT NULL
);

CREATE TABLE checkpoints (
    thread_id text NOT NULL,
    checkpoint_ns text DEFAULT ''::text NOT NULL,
    checkpoint_id text NOT NULL,
    parent_checkpoint_id text,
    type text,
    checkpoint jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE TABLE file (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id uuid,
    hash text,
    filename text,
    path text,
    data jsonb,
    meta jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE invitation (
    id uuid DEFAULT uuidv7() NOT NULL,
    organization_id uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text DEFAULT 'pending'::text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    inviter_id uuid NOT NULL
);

CREATE TABLE jwks (
    id uuid DEFAULT uuidv7() NOT NULL,
    public_key text NOT NULL,
    private_key text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone
);

CREATE TABLE knowledge (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id uuid,
    name text,
    description text,
    data jsonb,
    meta jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE knowledge_file (
    id uuid DEFAULT uuidv7() NOT NULL,
    user_id uuid NOT NULL,
    knowledge_id uuid NOT NULL,
    file_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE member (
    id uuid DEFAULT uuidv7() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE organization (
    id uuid DEFAULT uuidv7() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata text
);

CREATE TABLE session (
    id uuid DEFAULT uuidv7() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address text,
    user_agent text,
    user_id uuid NOT NULL,
    active_organization_id uuid
);

CREATE TABLE "user" (
    id uuid DEFAULT uuidv7() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    image text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE verification (
    id uuid DEFAULT uuidv7() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);

ALTER TABLE ONLY chat_file
    ADD CONSTRAINT chat_file_pkey PRIMARY KEY (id);

ALTER TABLE ONLY chat_message
    ADD CONSTRAINT chat_message_pkey PRIMARY KEY (id);

ALTER TABLE ONLY chat
    ADD CONSTRAINT chat_pkey PRIMARY KEY (id);

ALTER TABLE ONLY chat
    ADD CONSTRAINT chat_share_id_key UNIQUE (share_id);

ALTER TABLE ONLY checkpoint_blobs
    ADD CONSTRAINT checkpoint_blobs_pkey PRIMARY KEY (thread_id, checkpoint_ns, channel, version);

ALTER TABLE ONLY checkpoint_migrations
    ADD CONSTRAINT checkpoint_migrations_pkey PRIMARY KEY (v);

ALTER TABLE ONLY checkpoint_writes
    ADD CONSTRAINT checkpoint_writes_pkey PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx);

ALTER TABLE ONLY checkpoints
    ADD CONSTRAINT checkpoints_pkey PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id);

ALTER TABLE ONLY file
    ADD CONSTRAINT file_pkey PRIMARY KEY (id);

ALTER TABLE ONLY invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);

ALTER TABLE ONLY jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY knowledge_file
    ADD CONSTRAINT knowledge_file_pkey PRIMARY KEY (id);

ALTER TABLE ONLY knowledge
    ADD CONSTRAINT knowledge_pkey PRIMARY KEY (id);

ALTER TABLE ONLY member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);

ALTER TABLE ONLY organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);

ALTER TABLE ONLY organization
    ADD CONSTRAINT organization_slug_unique UNIQUE (slug);

ALTER TABLE ONLY session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);

ALTER TABLE ONLY session
    ADD CONSTRAINT session_token_unique UNIQUE (token);

ALTER TABLE ONLY chat_file
    ADD CONSTRAINT uq_chat_file_chat_file UNIQUE (chat_id, file_id);

ALTER TABLE ONLY knowledge_file
    ADD CONSTRAINT uq_knowledge_file_knowledge_file UNIQUE (knowledge_id, file_id);

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_email_unique UNIQUE (email);

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);

ALTER TABLE ONLY verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);

CREATE INDEX "account_userId_idx" ON account USING btree (user_id);

CREATE INDEX checkpoint_blobs_thread_id_idx ON checkpoint_blobs USING btree (thread_id);

CREATE INDEX checkpoint_writes_thread_id_idx ON checkpoint_writes USING btree (thread_id);

CREATE INDEX checkpoints_thread_id_idx ON checkpoints USING btree (thread_id);

CREATE INDEX idx_chat_file_file_id ON chat_file USING btree (file_id);

CREATE INDEX idx_chat_file_message_id ON chat_file USING btree (message_id) WHERE (message_id IS NOT NULL);

CREATE INDEX idx_chat_file_user_id ON chat_file USING btree (user_id);

CREATE INDEX idx_chat_message_chat_created_at ON chat_message USING btree (chat_id, created_at);

CREATE INDEX idx_chat_message_chat_parent ON chat_message USING btree (chat_id, parent_id);

CREATE INDEX idx_chat_message_created_at ON chat_message USING btree (created_at);

CREATE INDEX idx_chat_message_model_created_at ON chat_message USING btree (model_id, created_at);

CREATE INDEX idx_chat_message_user_created_at ON chat_message USING btree (user_id, created_at);

CREATE INDEX idx_chat_user_folder_updated_at ON chat USING btree (user_id, folder_id, updated_at DESC);

CREATE INDEX idx_chat_user_pinned_updated_at ON chat USING btree (user_id, updated_at DESC) WHERE (pinned IS TRUE);

CREATE INDEX idx_chat_user_updated_at ON chat USING btree (user_id, updated_at DESC);

CREATE INDEX idx_file_hash ON file USING btree (hash) WHERE (hash IS NOT NULL);

CREATE INDEX idx_file_user_created_at ON file USING btree (user_id, created_at DESC);

CREATE INDEX idx_knowledge_file_file_id ON knowledge_file USING btree (file_id);

CREATE INDEX idx_knowledge_file_user_id ON knowledge_file USING btree (user_id);

CREATE INDEX idx_knowledge_user_updated_at ON knowledge USING btree (user_id, updated_at DESC);

CREATE INDEX invitation_email_idx ON invitation USING btree (email);

CREATE INDEX "invitation_organizationId_idx" ON invitation USING btree (organization_id);

CREATE INDEX "member_organizationId_idx" ON member USING btree (organization_id);

CREATE INDEX "member_userId_idx" ON member USING btree (user_id);

CREATE INDEX "session_userId_idx" ON session USING btree (user_id);

CREATE INDEX verification_identifier_idx ON verification USING btree (identifier);

ALTER TABLE ONLY account
    ADD CONSTRAINT account_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY chat_file
    ADD CONSTRAINT fk_chat_file_chat FOREIGN KEY (chat_id) REFERENCES chat(id) ON DELETE CASCADE;

ALTER TABLE ONLY chat_file
    ADD CONSTRAINT fk_chat_file_file FOREIGN KEY (file_id) REFERENCES file(id) ON DELETE CASCADE;

ALTER TABLE ONLY chat_message
    ADD CONSTRAINT fk_chat_message_chat FOREIGN KEY (chat_id) REFERENCES chat(id) ON DELETE CASCADE;

ALTER TABLE ONLY knowledge_file
    ADD CONSTRAINT fk_knowledge_file_file FOREIGN KEY (file_id) REFERENCES file(id) ON DELETE CASCADE;

ALTER TABLE ONLY knowledge_file
    ADD CONSTRAINT fk_knowledge_file_knowledge FOREIGN KEY (knowledge_id) REFERENCES knowledge(id) ON DELETE CASCADE;

ALTER TABLE ONLY invitation
    ADD CONSTRAINT invitation_inviter_id_user_id_fk FOREIGN KEY (inviter_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY invitation
    ADD CONSTRAINT invitation_organization_id_organization_id_fk FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE;

ALTER TABLE ONLY member
    ADD CONSTRAINT member_organization_id_organization_id_fk FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE;

ALTER TABLE ONLY member
    ADD CONSTRAINT member_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY session
    ADD CONSTRAINT session_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
