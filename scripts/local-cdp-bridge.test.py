#!/usr/bin/env python3
import importlib.util
from pathlib import Path
import unittest

MODULE_PATH = Path(__file__).with_name("local-cdp-bridge.py")
spec = importlib.util.spec_from_file_location("local_cdp_bridge", MODULE_PATH)
assert spec and spec.loader
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)


class LocalCdpBridgeTargetValidationTest(unittest.TestCase):
    def test_allows_loopback_target(self):
        self.assertTrue(bridge.is_allowed_target_host("127.0.0.1", allowed_wsl_gateway_hosts=set()))
        self.assertTrue(bridge.is_allowed_target_host("::1", allowed_wsl_gateway_hosts=set()))

    def test_allows_wsl_gateway_nameserver_from_resolv_conf(self):
        resolv_conf = "nameserver 172.29.112.1\n"
        allowed = bridge.allowed_wsl_gateway_hosts_from_resolv_conf(resolv_conf)

        self.assertEqual(allowed, {"172.29.112.1"})
        self.assertTrue(bridge.is_allowed_target_host("172.29.112.1", allowed_wsl_gateway_hosts=allowed))

    def test_rejects_hostname_and_non_gateway_targets(self):
        allowed = {"172.29.112.1"}

        for target_host in [
            "localhost",
            "windows-host.local",
            "8.8.8.8",
            "192.168.1.20",
            "0.0.0.0",
            "224.0.0.1",
        ]:
            with self.subTest(target_host=target_host):
                self.assertFalse(bridge.is_allowed_target_host(target_host, allowed_wsl_gateway_hosts=allowed))


if __name__ == "__main__":
    unittest.main()
