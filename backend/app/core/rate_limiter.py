"""In-memory sliding window rate limiter for brute-force protection."""

import threading
import time
from collections import defaultdict


class SlidingWindowRateLimiter:
    """Thread-safe in-memory rate limiter tracking timestamps per key (e.g. client IP or username)."""

    def __init__(self, max_attempts: int = 5, window_seconds: int = 60):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._attempts: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def _cleanup_old_records(self, key: str, now: float) -> None:
        """Remove timestamps outside the sliding window."""
        cutoff = now - self.window_seconds
        self._attempts[key] = [t for t in self._attempts[key] if t > cutoff]
        if not self._attempts[key]:
            del self._attempts[key]

    def is_allowed(self, key: str) -> tuple[bool, int]:
        """Check if request is allowed under current rate limits.

        Returns:
            (is_allowed, retry_after_seconds)
        """
        now = time.monotonic()
        with self._lock:
            self._cleanup_old_records(key, now)
            timestamps = self._attempts.get(key, [])
            if len(timestamps) >= self.max_attempts:
                oldest = timestamps[0]
                retry_after = int(self.window_seconds - (now - oldest)) + 1
                return False, max(1, retry_after)
            return True, 0

    def record_attempt(self, key: str) -> None:
        """Record an attempt timestamp for the given key."""
        now = time.monotonic()
        with self._lock:
            self._cleanup_old_records(key, now)
            self._attempts[key].append(now)

    def reset(self, key: str) -> None:
        """Reset rate limit history for a key on successful action."""
        with self._lock:
            self._attempts.pop(key, None)


# Default global rate limiter for authentication endpoints: max 5 failed attempts per 60s
login_rate_limiter = SlidingWindowRateLimiter(max_attempts=5, window_seconds=60)
