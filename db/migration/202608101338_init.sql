CREATE TABLE account (
    id text NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id text NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp without time zone,
    refresh_token_expires_at timestamp without time zone,
    scope text,
    password text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone NOT NULL
);

CREATE TABLE invitation (
    id text NOT NULL,
    organization_id text NOT NULL,
    email text NOT NULL,
    role text,
    status text DEFAULT 'pending'::text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    inviter_id text NOT NULL
);

CREATE TABLE member (
    id text NOT NULL,
    organization_id text NOT NULL,
    user_id text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    created_at timestamp without time zone NOT NULL
);

CREATE TABLE organization (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    created_at timestamp without time zone NOT NULL,
    metadata text
);

CREATE TABLE session (
    id text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    token text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    ip_address text,
    user_agent text,
    user_id text NOT NULL,
    active_organization_id text
);

CREATE TABLE "user" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    image text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);

ALTER TABLE ONLY invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);

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

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_email_unique UNIQUE (email);

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);

ALTER TABLE ONLY verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);

CREATE INDEX "account_userId_idx" ON account USING btree (user_id);

CREATE INDEX invitation_email_idx ON invitation USING btree (email);

CREATE INDEX "invitation_organizationId_idx" ON invitation USING btree (organization_id);

CREATE INDEX "member_organizationId_idx" ON member USING btree (organization_id);

CREATE INDEX "member_userId_idx" ON member USING btree (user_id);

CREATE INDEX "session_userId_idx" ON session USING btree (user_id);

CREATE INDEX verification_identifier_idx ON verification USING btree (identifier);

ALTER TABLE ONLY account
    ADD CONSTRAINT account_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

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
