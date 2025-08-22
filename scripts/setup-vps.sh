#!/bin/bash

# Exit on any error
set -e

# Default values
DEFAULT_USERNAME="deploy"
AXEL_USERNAME="axel"
DEFAULT_SSH_PORT=22

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[+]${NC} $1"
}

print_error() {
    echo -e "${RED}[!]${NC} $1"
}

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root"
    exit 1
fi

# Get username
read -p "Enter deployment username (default: $DEFAULT_USERNAME): " USERNAME
USERNAME=${USERNAME:-$DEFAULT_USERNAME}

# Create "deploy" user if it doesn't exist
if id "$USERNAME" &>/dev/null; then
    print_status "User $USERNAME already exists, skipping creation..."
else
    print_status "Creating user $USERNAME..."
    useradd -m -s /bin/bash "$USERNAME" || {
        print_error "Failed to create user"
        exit 1
    }
    # Add user to docker group
    print_status "Adding $USERNAME to docker group..."
    usermod -aG docker "$USERNAME"
fi

# Create a non-root "axel" user with sudo privileges
if id "$AXEL_USERNAME" &>/dev/null; then
    print_status "User $AXEL_USERNAME already exists, skipping creation..."
else
    print_status "Creating user $AXEL_USERNAME..."
    useradd -m -s /bin/bash "$AXEL_USERNAME" || {
        print_error "Failed to create user $AXEL_USERNAME"
        exit 1
    }
    print_status "Adding $AXEL_USERNAME to sudo group..."
    usermod -aG sudo "$AXEL_USERNAME"
    # Add axel to docker group
    print_status "Adding $AXEL_USERNAME to docker group..."
    usermod -aG docker "$AXEL_USERNAME"

    # Set password for axel user
    print_status "Please set a password for the user so it can sudo '$AXEL_USERNAME'."
    passwd "$AXEL_USERNAME"
fi

# Set up SSH directory for deploy user
print_status "Setting up SSH directory for $USERNAME..."
mkdir -p "/home/$USERNAME/.ssh"
chmod 700 "/home/$USERNAME/.ssh"
touch "/home/$USERNAME/.ssh/authorized_keys"
chmod 600 "/home/$USERNAME/.ssh/authorized_keys"
chown -R "$USERNAME:$USERNAME" "/home/$USERNAME/.ssh"

# Set up SSH directory for axel user
print_status "Setting up SSH directory for $AXEL_USERNAME..."
mkdir -p "/home/$AXEL_USERNAME/.ssh"
chmod 700 "/home/$AXEL_USERNAME/.ssh"
touch "/home/$AXEL_USERNAME/.ssh/authorized_keys"
chmod 600 "/home/$AXEL_USERNAME/.ssh/authorized_keys"
chown -R "$AXEL_USERNAME:$AXEL_USERNAME" "/home/$AXEL_USERNAME/.ssh"

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    print_status "Docker already installed, skipping installation."
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    print_status "Docker Compose already installed, skipping installation."
fi

# Set up project directory
PROJECT_DIR="/home/$USERNAME/app"
print_status "Creating project directory at $PROJECT_DIR..."
mkdir -p "$PROJECT_DIR"

# Set up Docker volumes directories
print_status "Setting up Docker volumes directories..."
DOCKER_DATA_DIR="/var/docker/aleromano.com"
mkdir -p "$DOCKER_DATA_DIR/nginx/logs"
mkdir -p "$DOCKER_DATA_DIR/nginx/cache"

# Set proper ownership and permissions
chown -R "$USERNAME:docker" "$DOCKER_DATA_DIR"
chmod -R 775 "$DOCKER_DATA_DIR"

# Set proper ownership for project directory
chown -R "$USERNAME:$USERNAME" "$PROJECT_DIR"

# Configure SSH
print_status "Configuring SSH..."

# Check if OpenSSH is installed, if not install it
if ! command -v sshd &> /dev/null; then
    print_status "Installing OpenSSH Server..."
    apt-get update
    apt-get install -y openssh-server
else
    print_status "OpenSSH Server already installed, skipping installation."
fi

# Check if non-root sudo users exist before hardening SSH
print_status "Checking for non-root sudo users..."
NON_ROOT_SUDO_EXISTS=false
for user in $(awk -F: '$3 >= 1000 && $1 != "nobody" {print $1}' /etc/passwd); do
    if groups "$user" 2>/dev/null | grep -q '\bsudo\b'; then
        NON_ROOT_SUDO_EXISTS=true
        print_status "Found non-root sudo user: $user"
        break
    fi
done

# Configure SSH regardless of config file location

# Harden SSH configuration
if [ "$NON_ROOT_SUDO_EXISTS" = true ]; then
    echo ""
    print_status "Non-root sudo users found. SSH hardening is recommended for security."
    read -p "Do you want to disable root SSH login? (y/n): " DISABLE_ROOT_LOGIN
    echo ""
    
    if [ "$DISABLE_ROOT_LOGIN" = "y" ] || [ "$DISABLE_ROOT_LOGIN" = "Y" ]; then
        for sshd_config in /etc/ssh/sshd_config /etc/sshd_config; do
            if [ -f "$sshd_config" ]; then
                print_status "Configuring SSH at $sshd_config..."
                sed -i 's/#\?PermitRootLogin.*/PermitRootLogin no/' "$sshd_config"
                sed -i 's/#\?PasswordAuthentication.*/PasswordAuthentication no/' "$sshd_config"
                sed -i 's/#\?UsePAM.*/UsePAM yes/' "$sshd_config"
                break
            fi
        done
        print_status "SSH hardening applied."
    else
        print_status "Skipping SSH root login disable as per user request."
        print_status "WARNING: Root SSH login remains enabled. Consider hardening later."
    fi
else
    print_error "No non-root sudo users found. Skipping SSH hardening to prevent lockout."
    print_error "Please create and test access with a non-root sudo user before hardening SSH."
fi

# Try to restart SSH service
print_status "Attempting to restart SSH service..."
if systemctl is-active --quiet ssh; then
    systemctl restart ssh
elif systemctl is-active --quiet sshd; then
    systemctl restart sshd
else
    print_status "SSH service not found with standard names. Trying to find it..."
    SSH_SERVICE=$(systemctl list-units --type=service | grep -i ssh | head -n1 | awk '{print $1}')
    if [ ! -z "$SSH_SERVICE" ]; then
        print_status "Found SSH service: $SSH_SERVICE"
        systemctl restart "$SSH_SERVICE"
    else
        print_error "No SSH service found. Please restart SSH manually after script completion."
    fi
fi

# Set up UFW firewall
print_status "Configuring firewall..."
apt-get update

if ! dpkg -s ufw &> /dev/null; then
    print_status "Installing UFW firewall..."
    apt-get install -y ufw
else
    print_status "UFW already installed, skipping installation."
fi

ufw default deny incoming
ufw default allow outgoing
ufw allow $DEFAULT_SSH_PORT/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# Install and enable fail2ban for SSH brute-force protection
if ! dpkg -s fail2ban &> /dev/null; then
    print_status "Installing fail2ban..."
    apt-get install -y fail2ban
else
    print_status "fail2ban already installed, skipping installation."
fi

systemctl enable fail2ban
systemctl start fail2ban

# Configure fail2ban for SSH protection
if [ ! -f /etc/fail2ban/jail.local ]; then
    print_status "Creating fail2ban SSH jail configuration..."
    cat <<EOF > /etc/fail2ban/jail.local
[sshd]
enabled = true
mode = aggressive
EOF
    systemctl restart fail2ban
    print_status "fail2ban configured for SSH protection with aggressive mode."
else
    print_status "fail2ban jail.local already exists, skipping configuration."
fi

print_status "fail2ban installed and running."

# Install Certbot for SSL certificates with Let's Encrypt
if ! dpkg -s certbot &> /dev/null; then
    print_status "Installing Certbot..."
    apt-get install -y certbot
else
    print_status "Certbot already installed, skipping installation."
fi

# Create ACME challenge directory on the host
# This directory will be mapped into the Nginx container for Let's Encrypt HTTP-01 challenges.
# $PROJECT_DIR is typically /home/$USERNAME/app as defined earlier in this script.
ACME_CHALLENGE_DIR_HOST="$PROJECT_DIR/acme-challenge"
print_status "Creating ACME challenge directory at $ACME_CHALLENGE_DIR_HOST for Let's Encrypt..."
mkdir -p "$ACME_CHALLENGE_DIR_HOST"
# Set ownership to the deployment user so they can manage it if needed,
# and ensure it's readable by Nginx (which runs as root in the container by default).
chown "$USERNAME:$USERNAME" "$ACME_CHALLENGE_DIR_HOST"
chmod 755 "$ACME_CHALLENGE_DIR_HOST"

print_status "Certbot Installation Complete."
echo "----------------------------------------------------------------------------------------------------"
echo "IMPORTANT POST-SETUP STEPS FOR SSL (Let's Encrypt with Certbot):"
echo "1. Ensure your domain (e.g., aleromano.com and www.aleromano.com) points to this server's IP address."
echo "2. Your 'docker-compose.prod.yml' should map '$ACME_CHALLENGE_DIR_HOST' on the host to"
echo "   '/var/www/acme-challenge' inside the Nginx container. For example:"
echo "   volumes:"
echo "     - ./acme-challenge:/var/www/acme-challenge"
echo "3. Your Nginx configuration (e.g., 'nginx/prod.conf') must have a location block for ACME challenges:"
echo "   location /.well-known/acme-challenge/ { root /var/www/acme-challenge; }"
echo "4. Deploy your application and Nginx using Docker Compose (e.g., docker-compose -f docker-compose.prod.yml up -d)."
echo "5. Once Nginx is running and publicly accessible, run Certbot MANUALLY AS ROOT on the HOST server:"
echo "   sudo certbot certonly --webroot -w $ACME_CHALLENGE_DIR_HOST \\"
echo "     -d YOUR_DOMAIN -d www.YOUR_DOMAIN \\"
echo "     --email YOUR_EMAIL --agree-tos --no-eff-email --non-interactive"
echo "   (Replace YOUR_DOMAIN and YOUR_EMAIL with your actual details. Use your primary domain for YOUR_DOMAIN)."
echo "6. Certbot automatically sets up a renewal process (usually via a systemd timer or cron job)."
echo "   Test this with: sudo certbot renew --dry-run"
echo "7. To ensure Nginx uses the renewed certificate, Certbot's renewal process needs to reload/restart Nginx."
echo "   You can add a --post-hook to a cron job/systemd timer for 'certbot renew'."
echo "   Example cron job (run 'sudo crontab -e' and add this line, adjust paths if necessary):"
echo "   0 3 * * * /usr/bin/certbot renew --quiet --post-hook \"cd $PROJECT_DIR && /usr/local/bin/docker-compose -f $PROJECT_DIR/docker-compose.prod.yml restart nginx\""
echo "   (This assumes docker-compose is at /usr/local/bin/docker-compose and your project is at $PROJECT_DIR)"
echo "----------------------------------------------------------------------------------------------------"

# Print completion message

# Fix /etc/shadow permissions
print_status "Setting /etc/shadow permissions to 600..."
chmod 600 /etc/shadow

print_status "Setup complete! Please:"
echo "1. Add your SSH public key to: /home/$USERNAME/.ssh/authorized_keys"
echo "2. Add your SSH public key to: /home/$AXEL_USERNAME/.ssh/authorized_keys (for axel user)"
echo "3. Place your docker-compose.yml in: $PROJECT_DIR"
echo "4. Add these secrets to your GitHub repository:"
echo "   HETZNER_HOST: <your-server-ip>"
echo "   HETZNER_USERNAME: $USERNAME"
echo "   HETZNER_SSH_KEY: <your-private-ssh-key>"
echo "5. Docker volumes are set up at: $DOCKER_DATA_DIR"
echo "6. Security hardening applied: sudo users ($USERNAME, $AXEL_USERNAME), fail2ban, SSH config, shadow permissions."

# Print warning about SSH key
print_error "IMPORTANT: Make sure to add your SSH public keys for both users before logging out!"