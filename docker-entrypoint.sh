#!/bin/sh
set -e

echo "🛡️ [ShellGuard] Initializing Container..."

# PUID/PGID support: Match user ID to host user
TARGET_UID=${PUID:-1000}
TARGET_GID=${PGID:-1000}

# Modify 'node' user if running as root and IDs differ
if [ "$(id -u)" = "0" ] && [ "$TARGET_UID" != "1000" ]; then
    echo "🔧 [ShellGuard] Updating 'node' user to UID: $TARGET_UID / GID: $TARGET_GID"

    # Check if group exists
    if getent group "$TARGET_GID" >/dev/null; then
        groupmod -o -g "$TARGET_GID" node || true
    else
        groupmod -g "$TARGET_GID" node
    fi

    usermod -o -u "$TARGET_UID" -g "$TARGET_GID" node
fi

# Ensure storage directory exists and is writable by the target user
if [ -d "$DATA_DIR" ]; then
    echo "📦 [ShellGuard] Fixing permissions for $DATA_DIR..."
    chown -R "$TARGET_UID:$TARGET_GID" "$DATA_DIR"
elif [ -n "$DATA_DIR" ]; then
    echo "📦 [ShellGuard] Creating directory $DATA_DIR..."
    mkdir -p "$DATA_DIR"
    chown -R "$TARGET_UID:$TARGET_GID" "$DATA_DIR"
fi

# Switch to 'node' user if running as root
if [ "$(id -u)" = "0" ]; then
    echo "🔒 [ShellGuard] Dropping privileges to user 'node' (UID: $(id -u node))..."
    exec su-exec node "$@"
else
    exec "$@"
fi
