import re
import ipaddress
from fastapi import HTTPException, status

def normalize_domain_name(domain: str) -> str:
    """Ensures domain names end with a trailing dot (FQDN standard)."""
    domain = domain.strip().lower()
    if not domain.endswith("."):
        domain += "."
    return domain

def normalize_record_name(record_name: str, zone_name: str) -> str:
    """
    Handles Route 53 edge cases where users input '@', empty strings, 
    or partial subdomains. Maps them correctly to the fully qualified domain name.
    """
    raw_name = record_name.strip().rstrip('.')
    norm_zone = normalize_domain_name(zone_name)
    
    # Handle apex representations (@ or empty) or exact match without trailing dot
    if raw_name in ["", "@"] or raw_name == zone_name.strip().rstrip('.'):
        return norm_zone
    
    # If the user only typed the subdomain (e.g., 'api' instead of 'api.example.com')
    if not raw_name.endswith(zone_name.strip().rstrip('.')):
        return f"{raw_name}.{norm_zone}"
        
    return normalize_domain_name(raw_name)

def validate_record_value(record_type: str, value: str, record_name: str, zone_name: str):
    """
    Validates DNS record values against strict AWS Route 53 rules and edge cases.
    Supports multi-line inputs separated by newlines.
    """
    lines = [line.strip() for line in value.strip().split("\n") if line.strip()]
    if not lines:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Record value cannot be empty."
        )

    norm_record_name = normalize_domain_name(record_name)
    norm_zone_name = normalize_domain_name(zone_name)

    # Edge Case: CNAME at Zone Apex rule (RFC 1034 restriction)
    if record_type == "CNAME" and norm_record_name == norm_zone_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zone Apex restriction: CNAME record cannot be created at the root/apex of the Hosted Zone."
        )

    for line in lines:
        if record_type == "A":
            try:
                ip = ipaddress.ip_address(line)
                if ip.version != 4:
                    raise ValueError()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid IPv4 address format for A record: '{line}'"
                )

        elif record_type == "AAAA":
            try:
                ip = ipaddress.ip_address(line)
                if ip.version != 6:
                    raise ValueError()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid IPv6 address format for AAAA record: '{line}'"
                )

        elif record_type == "CNAME":
            # CNAME value must not be an IP address
            try:
                ipaddress.ip_address(line)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CNAME record target cannot be an IP address. It must be a valid domain name."
                )
            except ValueError:
                pass  

        elif record_type == "MX":
            # Must be formatted as: <Priority 0-65535> <Mail Server Hostname>
            parts = line.split()
            if len(parts) != 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"MX record must be in format '<priority> <hostname>' (e.g., '10 mail.example.com.'). Received: '{line}'"
                )
            try:
                priority = int(parts[0])
                if not (0 <= priority <= 65535):
                    raise ValueError()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"MX priority must be an integer between 0 and 65535. Received: '{parts[0]}'"
                )

        elif record_type == "TXT":
            # TXT values containing spaces must be wrapped in double quotes
            if " " in line and not (line.startswith('"') and line.endswith('"')):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"TXT record values with spaces must be enclosed in double quotes: \"{line}\""
                )

        elif record_type == "CAA":
            # Formatted as: <flags> <tag> "<value>"
            parts = line.split(maxsplit=2)
            if len(parts) < 3:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"CAA record must follow '<flags> <tag> \"<value>\"' format. Received: '{line}'"
                )
            tag = parts[1].lower()
            if tag not in ["issue", "issuewild", "iodef"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"CAA tag must be 'issue', 'issuewild', or 'iodef'. Received: '{parts[1]}'"
                )
                
        elif record_type == "SRV":
            # Formatted as: <priority> <weight> <port> <target>
            parts = line.split()
            if len(parts) != 4:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"SRV record must be in format '<priority> <weight> <port> <target>'. Received: '{line}'"
                )
            try:
                priority, weight, port = int(parts[0]), int(parts[1]), int(parts[2])
                if not (0 <= priority <= 65535 and 0 <= weight <= 65535 and 0 <= port <= 65535):
                    raise ValueError()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="SRV priority, weight, and port must be integers between 0 and 65535."
                )

        elif record_type == "PTR":
            # PTR target must not be an IP address
            try:
                ipaddress.ip_address(line)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="PTR record target cannot be an IP address. It must be a valid domain name."
                )
            except ValueError:
                pass