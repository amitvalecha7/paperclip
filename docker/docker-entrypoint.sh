#!/bin/bash
set -e

CONFIG_PATH="/paperclip/instances/default/config.json"

# 1. Automatic Onboarding (First Run)
if [ ! -f "$CONFIG_PATH" ]; then
    echo "Creating initial Paperclip configuration..."
    pnpm paperclipai onboard --yes
    
    # Ensure deploymentMode is set to authenticated if we want to bootstrap CEO
    # The default 'onboard --yes' might set it to local_trusted
    sed -i 's/"deploymentMode": "local_trusted"/"deploymentMode": "authenticated"/' "$CONFIG_PATH"
    
    echo "Onboarding complete."
    AUTO_BOOTSTRAP=true
else
    AUTO_BOOTSTRAP=false
fi

# 2. Automatic CEO Bootstrapping
if [ "$AUTO_BOOTSTRAP" = true ]; then
    echo "Bootstrapping initial admin (CEO)..."
    # Run the bootstrap command and extract the token
    BOOTSTRAP_OUTPUT=$(pnpm paperclipai auth bootstrap-ceo)
    
    # Extract token from the URL (e.g., http://.../invite/pcp_bootstrap_...)
    INVITE_TOKEN=$(echo "$BOOTSTRAP_OUTPUT" | grep -o "pcp_bootstrap_[a-zA-Z0-9]*" || true)
    
    if [ -n "$INVITE_TOKEN" ]; then
        echo "Exporting bootstrap invite token for automatic UI redirect."
        export PAPERCLIP_BOOTSTRAP_INVITE_TOKEN="$INVITE_TOKEN"
    fi

    echo "----------------------------------------------------------------"
    echo "INITIAL ADMIN SETUP REQUIRED"
    echo "$BOOTSTRAP_OUTPUT"
    echo "----------------------------------------------------------------"
fi

# 3. Start the application
echo "Starting Paperclip..."
exec "$@"
