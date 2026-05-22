#!/usr/bin/env python3
"""Privacy/safety scan for git-tracked ServiceNow Automation files.

This intentionally scans only `git ls-files` paths. Browser profiles and
other runtime artifacts live under ignored `.local/` folders and may contain
cookies, sessions, history, or customer URLs; ordinary pre-commit scans must
not walk those directories or print their contents.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


COOKIE_WORD = "coo" + "kie"
SENSITIVE_QUERY_NAMES = ["to" + "ken", "sys" + "_id"]

PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    (
        "real_servicenow_host",
        re.compile(r"\b[A-Za-z0-9.-]+\.service-now\.com\b", re.IGNORECASE),
    ),
    ("ticket_like_id", re.compile(r"\b(?:INC|CHG|REQ|RITM|TASK)\d{6,}\b", re.IGNORECASE)),
    ("credential_bearing_url", re.compile(r"https?://[^\s/@]+:[^\s/@]+@", re.IGNORECASE)),
    (
        "cookie_header_or_assignment",
        re.compile(r"\b(?:set-)?" + COOKIE_WORD + r"\s*[:=]\s*[^\s;]+", re.IGNORECASE),
    ),
]

for query_name in SENSITIVE_QUERY_NAMES:
    PATTERNS.append(
        (
            f"{query_name}_query_shape",
            re.compile(
                rf"(?:[?&]|%3[fF]|%253[fF]|%ZZ){re.escape(query_name)}(?:\s*=|%3[dD]|%253[dD])",
                re.IGNORECASE,
            ),
        )
    )


def git_ls_files() -> list[Path]:
    raw = subprocess.check_output(["git", "ls-files", "-z"], text=False)
    return [Path(item.decode()) for item in raw.split(b"\0") if item]


def should_skip(path: Path) -> bool:
    # Defense-in-depth: git ls-files should already exclude these, but keep the
    # guard here so future forced/tracked mistakes fail safer.
    parts = set(path.parts)
    return bool(parts & {".git", "node_modules", "dist", "out", "build", "coverage"})


def scan_file(path: Path) -> list[tuple[int, str]]:
    try:
        data = path.read_bytes()
    except OSError:
        return []
    if b"\0" in data[:4096]:
        return []
    text = data.decode("utf-8", errors="ignore")
    findings: list[tuple[int, str]] = []
    for name, pattern in PATTERNS:
        for match in pattern.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            findings.append((line, name))
    return findings


def main() -> int:
    findings: list[tuple[Path, int, str]] = []
    files = git_ls_files()
    for path in files:
        if should_skip(path):
            continue
        for line, name in scan_file(path):
            findings.append((path, line, name))

    if findings:
        print("TRACKED_PRIVACY_SCAN_FAIL")
        for path, line, name in findings[:200]:
            print(f"{path}:{line}:{name}")
        if len(findings) > 200:
            print(f"... {len(findings) - 200} more findings omitted")
        return 1

    print(f"TRACKED_PRIVACY_SCAN_PASS files={len(files)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
