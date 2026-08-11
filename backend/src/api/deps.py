from typing import Annotated

import jwt
from fastapi import HTTPException
from fastapi.params import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from pydantic import BaseModel

from .settings import backend_settings


class User(BaseModel):
    id: str
    name: str


bearer = HTTPBearer()
JWKS_URL = backend_settings.next_public_api_url
print(f"JWKS_URL: {JWKS_URL}")
jwks_client = PyJWKClient(JWKS_URL)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer)],
) -> User:
    try:
        token = credentials.credentials
        # Fetch the JWKS (JSON Web Key Set) from the provided URL
        jwks_client = PyJWKClient(backend_settings.next_public_api_url, cache_keys=True)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Decode the JWT using the signing key
        decoded_token = jwt.decode(
            token,
            signing_key.key,
            algorithms=["EdDSA"],
            options={
                "verify_aud": False,
                "verify_iss": False,
            },  # Adjust as needed for your use case
        )

        if (
            not decoded_token
            or "sub" not in decoded_token
            or "name" not in decoded_token
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing required claims",
            )

        user = User(
            id=decoded_token["sub"],
            name=decoded_token["name"],
        )

        if not user.id or not user.name:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing required claims",
            )
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expired",
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )
