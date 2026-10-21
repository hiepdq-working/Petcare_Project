#!/bin/sh
# Prints the API URLs to use for a real phone on the same Wi-Fi as this Mac.
# Usage: sh scripts/lan-url.sh
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
if [ -z "$IP" ]; then
  echo "Không tìm thấy IP LAN. Hãy kết nối Wi-Fi rồi chạy lại." >&2
  exit 1
fi
echo "IP LAN của Mac:            $IP"
echo "EXPO_PUBLIC_API_URL      = http://$IP:4000/api   (app mobile)"
echo "API_PUBLIC_URL           = http://$IP:4000        (file .env ở thư mục gốc, cho docker compose)"
