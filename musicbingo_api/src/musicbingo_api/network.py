"""Network utility functions for Music Bingo API."""

import socket


def get_local_ip() -> str:
    """Get the local network IP address of this machine.

    Returns the IP that other devices on the same network can use to connect.
    Falls back to 127.0.0.1 if no network interface found.
    """
    try:
        # Create UDP socket to external address (doesn't actually send data)
        # This is a reliable way to determine which network interface would be used
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"
