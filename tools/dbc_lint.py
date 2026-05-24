#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

MESSAGE_RE = re.compile(r"^BO_\s+(\d+)\s+([A-Za-z0-9_]+):")
SIGNAL_RE = re.compile(r"^\s+SG_\s+([A-Za-z0-9_]+)\s+:")


def lint_dbc(path: Path) -> int:
    text = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    messages: dict[int, str] = {}
    signals: set[str] = set()
    errors: list[str] = []
    current_message = None

    for lineno, line in enumerate(text, start=1):
        msg_match = MESSAGE_RE.match(line)
        if msg_match:
            can_id = int(msg_match.group(1))
            name = msg_match.group(2)
            if can_id in messages:
                errors.append(f"Line {lineno}: duplicate CAN ID {can_id} used by {name} and {messages[can_id]}")
            messages[can_id] = name
            current_message = name
            continue

        sig_match = SIGNAL_RE.match(line)
        if sig_match:
            signal = sig_match.group(1)
            if signal in signals:
                errors.append(f"Line {lineno}: duplicate signal name {signal}")
            signals.add(signal)
            if current_message is None:
                errors.append(f"Line {lineno}: signal {signal} appears before any message")

    if not messages:
        errors.append("No CAN messages found")
    if not signals:
        errors.append("No CAN signals found")

    print(f"DBC: {path}")
    print(f"Messages: {len(messages)}")
    print(f"Signals: {len(signals)}")

    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Lint passed")
    return 0


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: dbc_lint.py path/to/file.dbc")
        return 2
    return lint_dbc(Path(sys.argv[1]))


if __name__ == "__main__":
    raise SystemExit(main())
