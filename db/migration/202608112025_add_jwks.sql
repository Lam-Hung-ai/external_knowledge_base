CREATE TABLE jwks (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);
