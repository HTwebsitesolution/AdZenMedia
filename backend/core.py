import hashlib
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument

load_dotenv(Path(__file__).parent / ".env")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]


def env(key: str, default: str = "") -> str:
    return os.environ.get(key, default).strip().strip('"')


def env_int(key: str, default: int) -> int:
    try:
        return int(env(key) or default)
    except ValueError:
        return default


def env_bool(key: str) -> bool:
    return env(key).lower() in ("1", "true", "yes", "on")


def now() -> datetime:
    return datetime.now(timezone.utc)


def iso() -> str:
    return now().isoformat()


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    return fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "")


def ip_hash(request: Request) -> str:
    # Hashed so raw IPs never reach the database.
    return hashlib.sha256(f"{env('DB_NAME')}:{client_ip(request)}".encode()).hexdigest()[:24]


async def rate_limit(request: Request, bucket: str, limit: int, window_s: int) -> None:
    key = f"{bucket}:{ip_hash(request)}:{int(time.time() // window_s)}"
    doc = await db.rate_limits.find_one_and_update(
        {"key": key},
        {"$inc": {"n": 1}, "$setOnInsert": {"expires_at": now() + timedelta(seconds=window_s * 2)}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    if doc["n"] > limit:
        raise HTTPException(status_code=429, detail="Too many requests. Please try again a little later.")
