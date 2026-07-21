"""Shared rate limiter for brute-force-sensitive endpoints (in-memory, per-instance).

Best-effort only: Vercel's serverless model runs multiple instances, so this
does not enforce a single global limit. It still meaningfully raises the bar
against casual credential-stuffing / OTP-guessing scripts.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
