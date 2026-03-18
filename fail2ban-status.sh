#!/bin/bash

# Fail2Ban Status Check Script
echo "=== Fail2Ban Status Report ==="
echo "Date: $(date)"
echo ""

# Check Fail2Ban service status
echo "1. Fail2Ban Service Status:"
systemctl is-active fail2ban
echo ""

# Check active jails
echo "2. Active Jails:"
fail2ban-client status | grep "Jail list" | cut -d':' -f2 | tr -d ' '
echo ""

# Check banned IPs
echo "3. Currently Banned IPs:"
echo "--- SSHD Jail ---"
fail2ban-client status sshd | grep "Banned IP list" | cut -d':' -f2 | tr -d ' '
echo ""

echo "4. Fail2Ban Log (last 10 lines):"
if [ -f "/var/log/fail2ban.log" ]; then
    tail -n 10 /var/log/fail2ban.log
else
    echo "Log file not found"
fi
echo ""

echo "5. System Status:"
echo "Firewall: $(ufw status | head -1 | cut -d' ' -f2)"
echo "Fail2Ban: $(systemctl is-active fail2ban)"
echo ""

echo "=== End of Report ==="