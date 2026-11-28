"""Ids are a prefix plus a ULID (prd_ opp_ brf_ sc_ upl_ lrn_ task_ evt_ …)."""

from __future__ import annotations

import os
import time

_CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"


def ulid() -> str:
    value = (int(time.time() * 1000) << 80) | int.from_bytes(os.urandom(10), "big")
    return "".join(_CROCKFORD[(value >> (5 * i)) & 31] for i in reversed(range(26)))


def new_id(prefix: str) -> str:
    return f"{prefix}_{ulid()}"
