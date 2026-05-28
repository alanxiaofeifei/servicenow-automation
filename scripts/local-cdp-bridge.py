#!/usr/bin/env python3
"""Loopback-only WSL bridge for a supervised Windows Chromium CDP endpoint.

This exposes only 127.0.0.1:<listen-port> inside WSL and forwards to the
Windows host CDP endpoint. It does not inspect or log browser traffic.
"""

from __future__ import annotations

import argparse
import ipaddress
import socket
import sys
import threading
from contextlib import closing


RESOLV_CONF_PATH = "/etc/resolv.conf"


def pump(src: socket.socket, dst: socket.socket) -> None:
    try:
        while True:
            data = src.recv(65536)
            if not data:
                break
            dst.sendall(data)
    except OSError:
        pass
    finally:
        for sock in (src, dst):
            try:
                sock.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            try:
                sock.close()
            except OSError:
                pass


def handle_client(client: socket.socket, target_host: str, target_port: int) -> None:
    try:
        upstream = socket.create_connection((target_host, target_port), timeout=10)
    except OSError:
        try:
            client.close()
        except OSError:
            pass
        return

    threading.Thread(target=pump, args=(client, upstream), daemon=True).start()
    threading.Thread(target=pump, args=(upstream, client), daemon=True).start()


def allowed_wsl_gateway_hosts_from_resolv_conf(resolv_conf: str) -> set[str]:
    allowed: set[str] = set()
    for line in resolv_conf.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        parts = stripped.split()
        if len(parts) < 2 or parts[0] != "nameserver":
            continue
        try:
            address = ipaddress.ip_address(parts[1])
        except ValueError:
            continue
        if address.is_loopback or address.is_private:
            allowed.add(str(address))
    return allowed


def read_allowed_wsl_gateway_hosts(path: str = RESOLV_CONF_PATH) -> set[str]:
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return allowed_wsl_gateway_hosts_from_resolv_conf(handle.read())
    except OSError:
        return set()


def is_allowed_target_host(target_host: str, allowed_wsl_gateway_hosts: set[str]) -> bool:
    try:
        address = ipaddress.ip_address(target_host)
    except ValueError:
        return False

    if address.is_loopback:
        return True

    if (
        address.is_unspecified
        or address.is_multicast
        or address.is_global
        or address.is_reserved
        or address.is_link_local
    ):
        return False

    return str(address) in allowed_wsl_gateway_hosts


def main() -> int:
    parser = argparse.ArgumentParser(description="WSL loopback bridge for supervised Windows Chromium CDP")
    parser.add_argument("--target-host", required=True, help="Windows host IP reachable from WSL")
    parser.add_argument("--target-port", required=True, type=int, help="Windows Chromium CDP port")
    parser.add_argument("--listen-port", required=True, type=int, help="WSL loopback port to expose")
    args = parser.parse_args()

    if args.target_port <= 0 or args.target_port > 65535 or args.listen_port <= 0 or args.listen_port > 65535:
        print("CDP_BRIDGE_BLOCKED: invalid port", file=sys.stderr)
        return 2

    allowed_wsl_gateways = read_allowed_wsl_gateway_hosts()
    if not is_allowed_target_host(args.target_host, allowed_wsl_gateways):
        print("CDP_BRIDGE_BLOCKED: target host denied", file=sys.stderr)
        return 2

    listen = ("127.0.0.1", args.listen_port)
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as server:
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(listen)
        server.listen(64)
        print(f"LOCAL_CDP_BRIDGE_READY port={args.listen_port}", flush=True)
        while True:
            client, _addr = server.accept()
            threading.Thread(target=handle_client, args=(client, args.target_host, args.target_port), daemon=True).start()


if __name__ == "__main__":
    raise SystemExit(main())
