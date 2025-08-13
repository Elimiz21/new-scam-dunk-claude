#!/bin/bash

# SSL Certificate Generation Script for Scam Dunk
# Supports both Let's Encrypt (production) and self-signed (development)

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DOMAIN="${1:-scamdunk.com}"
EMAIL="${2:-admin@scamdunk.com}"
CERT_DIR="/etc/nginx/ssl"
ENVIRONMENT="${3:-production}"

echo -e "${GREEN}🔐 SSL Certificate Setup for $DOMAIN${NC}"

# Create certificate directory
sudo mkdir -p $CERT_DIR

if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${GREEN}Setting up Let's Encrypt certificate...${NC}"
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        if [ -f /etc/debian_version ]; then
            # Debian/Ubuntu
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        elif [ -f /etc/redhat-release ]; then
            # RHEL/CentOS/Fedora
            sudo yum install -y certbot python3-certbot-nginx
        elif [ "$(uname)" = "Darwin" ]; then
            # macOS
            brew install certbot
        else
            echo -e "${RED}Unsupported OS. Please install certbot manually.${NC}"
            exit 1
        fi
    fi
    
    # Generate Let's Encrypt certificate
    sudo certbot certonly \
        --nginx \
        --non-interactive \
        --agree-tos \
        --email $EMAIL \
        --domains $DOMAIN,www.$DOMAIN \
        --redirect \
        --keep-until-expiring \
        --expand
    
    # Create symbolic links for nginx
    sudo ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem $CERT_DIR/scamdunk.crt
    sudo ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem $CERT_DIR/scamdunk.key
    
    # Set up auto-renewal
    echo "Setting up auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 0,12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    
    echo -e "${GREEN}✅ Let's Encrypt certificate installed and auto-renewal configured${NC}"
    
elif [ "$ENVIRONMENT" = "staging" ]; then
    echo -e "${YELLOW}Setting up Let's Encrypt staging certificate...${NC}"
    
    sudo certbot certonly \
        --nginx \
        --non-interactive \
        --agree-tos \
        --email $EMAIL \
        --domains $DOMAIN,www.$DOMAIN \
        --staging \
        --force-renewal
    
    sudo ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem $CERT_DIR/scamdunk.crt
    sudo ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem $CERT_DIR/scamdunk.key
    
    echo -e "${GREEN}✅ Let's Encrypt staging certificate installed${NC}"
    
else
    echo -e "${YELLOW}Setting up self-signed certificate for development...${NC}"
    
    # Generate self-signed certificate
    sudo openssl req -x509 \
        -nodes \
        -days 365 \
        -newkey rsa:2048 \
        -keyout $CERT_DIR/scamdunk.key \
        -out $CERT_DIR/scamdunk.crt \
        -subj "/C=US/ST=State/L=City/O=ScamDunk/OU=Development/CN=$DOMAIN"
    
    # Generate DH parameters for added security
    sudo openssl dhparam -out $CERT_DIR/dhparam.pem 2048
    
    echo -e "${GREEN}✅ Self-signed certificate generated${NC}"
fi

# Set proper permissions
sudo chmod 600 $CERT_DIR/scamdunk.key
sudo chmod 644 $CERT_DIR/scamdunk.crt

# Verify certificate
echo -e "\n${GREEN}Certificate Information:${NC}"
openssl x509 -in $CERT_DIR/scamdunk.crt -noout -dates -subject

# Test nginx configuration
if command -v nginx &> /dev/null; then
    echo -e "\n${GREEN}Testing nginx configuration...${NC}"
    sudo nginx -t
    
    # Reload nginx if test passes
    if [ $? -eq 0 ]; then
        sudo systemctl reload nginx || sudo nginx -s reload
        echo -e "${GREEN}✅ Nginx reloaded with new certificate${NC}"
    else
        echo -e "${RED}❌ Nginx configuration test failed${NC}"
        exit 1
    fi
fi

# Create certificate monitoring script
cat > /tmp/check-cert-expiry.sh << 'EOF'
#!/bin/bash
CERT_FILE="/etc/nginx/ssl/scamdunk.crt"
DAYS_WARNING=30

if [ -f "$CERT_FILE" ]; then
    EXPIRY_DATE=$(openssl x509 -in $CERT_FILE -noout -enddate | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
    
    if [ $DAYS_LEFT -lt $DAYS_WARNING ]; then
        echo "WARNING: SSL certificate expires in $DAYS_LEFT days!"
        # Send alert (implement your notification method here)
    else
        echo "SSL certificate valid for $DAYS_LEFT more days"
    fi
fi
EOF

sudo mv /tmp/check-cert-expiry.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/check-cert-expiry.sh

# Add to crontab for daily checks
(crontab -l 2>/dev/null; echo "0 9 * * * /usr/local/bin/check-cert-expiry.sh") | crontab -

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}SSL Certificate Setup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "\nCertificate Location: $CERT_DIR/"
echo -e "Certificate File: scamdunk.crt"
echo -e "Private Key File: scamdunk.key"

if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo "1. Verify HTTPS access at https://$DOMAIN"
    echo "2. Test SSL configuration at https://www.ssllabs.com/ssltest/"
    echo "3. Monitor certificate expiry with: /usr/local/bin/check-cert-expiry.sh"
    echo "4. Check auto-renewal with: sudo certbot renew --dry-run"
fi