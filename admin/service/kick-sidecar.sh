#!/bin/sh
# Runs in the mu-kick image (alpine + iproute2-ss, built by install-vm.sh) that shares OpenMU's network. When the panel writes /d/kick it closes every player's
# connection on the game ports; OpenMU then saves the characters as if the players had left. Exits when no game port
# listens (OpenMU was recreated), so docker restarts it into the current network.
blind=0
while :; do
  if ss -ltn 2>/dev/null | grep -q ':4590[1-6] '; then blind=0; else blind=$((blind + 1)); [ "$blind" -gt 10 ] && exit 1; fi
  if [ -f /d/kick ]; then
    rm -f /d/kick
    ss -K -tn state established '( sport = :45901 or sport = :45902 or sport = :45903 or sport = :45904 or sport = :45905 or sport = :45906 )' >/dev/null 2>&1
  fi
  sleep 1
done
