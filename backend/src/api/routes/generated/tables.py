from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKeyConstraint,
    Index,
    MetaData,
    PrimaryKeyConstraint,
    Table,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB

metadata = MetaData()


t_chat = Table(
    "chat",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("user_id", Uuid),
    Column("title", Text),
    Column("chat", JSONB),
    Column("created_at", DateTime(True), server_default=text("now()")),
    Column("updated_at", DateTime(True), server_default=text("now()")),
    Column("share_id", Text),
    Column("archived", Boolean, server_default=text("false")),
    Column("pinned", Boolean, server_default=text("false")),
    Column("meta", JSONB, server_default=text("'{}'::jsonb")),
    Column("folder_id", Uuid),
    Column("tasks", JSONB),
    Column("summary", Text),
    Column("last_read_at", DateTime(True)),
    Column("current_message_id", Uuid),
    Column("variables", JSONB),
    PrimaryKeyConstraint("id", name="chat_pkey"),
    UniqueConstraint("share_id", name="chat_share_id_key"),
    Index("idx_chat_user_folder_updated_at", "user_id", "folder_id", "updated_at"),
    Index(
        "idx_chat_user_pinned_updated_at",
        "user_id",
        "updated_at",
        postgresql_where="(pinned IS TRUE)",
    ),
    Index("idx_chat_user_updated_at", "user_id", "updated_at"),
)

t_file = Table(
    "file",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("user_id", Uuid),
    Column("hash", Text),
    Column("filename", Text),
    Column("path", Text),
    Column("data", JSONB),
    Column("meta", JSONB),
    Column("created_at", DateTime(True), server_default=text("now()")),
    Column("updated_at", DateTime(True), server_default=text("now()")),
    PrimaryKeyConstraint("id", name="file_pkey"),
    Index("idx_file_hash", "hash", postgresql_where="(hash IS NOT NULL)"),
    Index("idx_file_user_created_at", "user_id", "created_at"),
)

t_jwks = Table(
    "jwks",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("public_key", Text, nullable=False),
    Column("private_key", Text, nullable=False),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("expires_at", DateTime(True)),
    PrimaryKeyConstraint("id", name="jwks_pkey"),
)

t_knowledge = Table(
    "knowledge",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("user_id", Uuid),
    Column("name", Text),
    Column("description", Text),
    Column("data", JSONB),
    Column("meta", JSONB),
    Column("created_at", DateTime(True), server_default=text("now()")),
    Column("updated_at", DateTime(True), server_default=text("now()")),
    PrimaryKeyConstraint("id", name="knowledge_pkey"),
    Index("idx_knowledge_user_updated_at", "user_id", "updated_at"),
)

t_organization = Table(
    "organization",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("name", Text, nullable=False),
    Column("slug", Text, nullable=False),
    Column("logo", Text),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("metadata", Text),
    PrimaryKeyConstraint("id", name="organization_pkey"),
    UniqueConstraint("slug", name="organization_slug_unique"),
)

t_user = Table(
    "user",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("name", Text, nullable=False),
    Column("email", Text, nullable=False),
    Column("email_verified", Boolean, nullable=False, server_default=text("false")),
    Column("image", Text),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("updated_at", DateTime(True), nullable=False, server_default=text("now()")),
    PrimaryKeyConstraint("id", name="user_pkey"),
    UniqueConstraint("email", name="user_email_unique"),
)

t_verification = Table(
    "verification",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("identifier", Text, nullable=False),
    Column("value", Text, nullable=False),
    Column("expires_at", DateTime(True), nullable=False),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("updated_at", DateTime(True), nullable=False, server_default=text("now()")),
    PrimaryKeyConstraint("id", name="verification_pkey"),
    Index("verification_identifier_idx", "identifier"),
)

t_account = Table(
    "account",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("account_id", Text, nullable=False),
    Column("provider_id", Text, nullable=False),
    Column("user_id", Uuid, nullable=False),
    Column("access_token", Text),
    Column("refresh_token", Text),
    Column("id_token", Text),
    Column("access_token_expires_at", DateTime(True)),
    Column("refresh_token_expires_at", DateTime(True)),
    Column("scope", Text),
    Column("password", Text),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("updated_at", DateTime(True), nullable=False, server_default=text("now()")),
    ForeignKeyConstraint(
        ["user_id"], ["user.id"], ondelete="CASCADE", name="account_user_id_user_id_fk"
    ),
    PrimaryKeyConstraint("id", name="account_pkey"),
    Index("account_userId_idx", "user_id"),
)

t_chat_file = Table(
    "chat_file",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("user_id", Uuid, nullable=False),
    Column("chat_id", Uuid, nullable=False),
    Column("file_id", Uuid, nullable=False),
    Column("message_id", Uuid),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("updated_at", DateTime(True), nullable=False, server_default=text("now()")),
    ForeignKeyConstraint(
        ["chat_id"], ["chat.id"], ondelete="CASCADE", name="fk_chat_file_chat"
    ),
    ForeignKeyConstraint(
        ["file_id"], ["file.id"], ondelete="CASCADE", name="fk_chat_file_file"
    ),
    PrimaryKeyConstraint("id", name="chat_file_pkey"),
    UniqueConstraint("chat_id", "file_id", name="uq_chat_file_chat_file"),
    Index("idx_chat_file_file_id", "file_id"),
    Index(
        "idx_chat_file_message_id",
        "message_id",
        postgresql_where="(message_id IS NOT NULL)",
    ),
    Index("idx_chat_file_user_id", "user_id"),
)

t_chat_message = Table(
    "chat_message",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("chat_id", Uuid, nullable=False),
    Column("user_id", Uuid),
    Column("role", Text, nullable=False),
    Column("parent_id", Uuid),
    Column("content", JSONB),
    Column("output", JSONB),
    Column("model_id", Text),
    Column("files", JSONB),
    Column("sources", JSONB),
    Column("embeds", JSONB),
    Column("meta", JSONB),
    Column("done", Boolean, server_default=text("true")),
    Column("status_history", JSONB),
    Column("error", JSONB),
    Column("usage", JSONB),
    Column("context_summary", Text),
    Column("created_at", DateTime(True), server_default=text("now()")),
    Column("updated_at", DateTime(True), server_default=text("now()")),
    ForeignKeyConstraint(
        ["chat_id"], ["chat.id"], ondelete="CASCADE", name="fk_chat_message_chat"
    ),
    PrimaryKeyConstraint("id", name="chat_message_pkey"),
    Index("idx_chat_message_chat_created_at", "chat_id", "created_at"),
    Index("idx_chat_message_chat_parent", "chat_id", "parent_id"),
    Index("idx_chat_message_created_at", "created_at"),
    Index("idx_chat_message_model_created_at", "model_id", "created_at"),
    Index("idx_chat_message_user_created_at", "user_id", "created_at"),
)

t_invitation = Table(
    "invitation",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("organization_id", Uuid, nullable=False),
    Column("email", Text, nullable=False),
    Column("role", Text),
    Column("status", Text, nullable=False, server_default=text("'pending'::text")),
    Column("expires_at", DateTime(True), nullable=False),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("inviter_id", Uuid, nullable=False),
    ForeignKeyConstraint(
        ["inviter_id"],
        ["user.id"],
        ondelete="CASCADE",
        name="invitation_inviter_id_user_id_fk",
    ),
    ForeignKeyConstraint(
        ["organization_id"],
        ["organization.id"],
        ondelete="CASCADE",
        name="invitation_organization_id_organization_id_fk",
    ),
    PrimaryKeyConstraint("id", name="invitation_pkey"),
    Index("invitation_email_idx", "email"),
    Index("invitation_organizationId_idx", "organization_id"),
)

t_knowledge_file = Table(
    "knowledge_file",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("user_id", Uuid, nullable=False),
    Column("knowledge_id", Uuid, nullable=False),
    Column("file_id", Uuid, nullable=False),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("updated_at", DateTime(True), nullable=False, server_default=text("now()")),
    ForeignKeyConstraint(
        ["file_id"], ["file.id"], ondelete="CASCADE", name="fk_knowledge_file_file"
    ),
    ForeignKeyConstraint(
        ["knowledge_id"],
        ["knowledge.id"],
        ondelete="CASCADE",
        name="fk_knowledge_file_knowledge",
    ),
    PrimaryKeyConstraint("id", name="knowledge_file_pkey"),
    UniqueConstraint(
        "knowledge_id", "file_id", name="uq_knowledge_file_knowledge_file"
    ),
    Index("idx_knowledge_file_file_id", "file_id"),
    Index("idx_knowledge_file_user_id", "user_id"),
)

t_member = Table(
    "member",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("organization_id", Uuid, nullable=False),
    Column("user_id", Uuid, nullable=False),
    Column("role", Text, nullable=False, server_default=text("'member'::text")),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    ForeignKeyConstraint(
        ["organization_id"],
        ["organization.id"],
        ondelete="CASCADE",
        name="member_organization_id_organization_id_fk",
    ),
    ForeignKeyConstraint(
        ["user_id"], ["user.id"], ondelete="CASCADE", name="member_user_id_user_id_fk"
    ),
    PrimaryKeyConstraint("id", name="member_pkey"),
    Index("member_organizationId_idx", "organization_id"),
    Index("member_userId_idx", "user_id"),
)

t_session = Table(
    "session",
    metadata,
    Column("id", Uuid, primary_key=True, server_default=text("uuidv7()")),
    Column("expires_at", DateTime(True), nullable=False),
    Column("token", Text, nullable=False),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("updated_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("ip_address", Text),
    Column("user_agent", Text),
    Column("user_id", Uuid, nullable=False),
    Column("active_organization_id", Uuid),
    ForeignKeyConstraint(
        ["user_id"], ["user.id"], ondelete="CASCADE", name="session_user_id_user_id_fk"
    ),
    PrimaryKeyConstraint("id", name="session_pkey"),
    UniqueConstraint("token", name="session_token_unique"),
    Index("session_userId_idx", "user_id"),
)
