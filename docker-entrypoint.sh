#!/bin/sh
set -e

echo "🛡️ [ShellGuard] Initializing Container..."

# PUID/PGID support: Match user ID to host user
TARGET_UID=${PUID:-1000}
TARGET_GID=${PGID:-1000}

# Validate that PUID and PGID are positive integers, falling back safely to 1000
case "$TARGET_UID" in
    ''|*[!0-9]*) TARGET_UID=1000 ;;
esac
case "$TARGET_GID" in
    ''|*[!0-9]*) TARGET_GID=1000 ;;
esac

# Modify 'node' user if running as root and either UID or GID differs from default (1000)
if [ "$(id -u)" = "0" ] && { [ "$TARGET_UID" != "1000" ] || [ "$TARGET_GID" != "1000" ]; }; then
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
TARGET_DATA_DIR="${DATA_DIR:-/app/data}"
if [ -d "$TARGET_DATA_DIR" ]; then
    echo "📦 [ShellGuard] Fixing permissions for $TARGET_DATA_DIR..."
    chown -R "$TARGET_UID:$TARGET_GID" "$TARGET_DATA_DIR"
else
    echo "📦 [ShellGuard] Creating directory $TARGET_DATA_DIR..."
    mkdir -p "$TARGET_DATA_DIR"
    chown -R "$TARGET_UID:$TARGET_GID" "$TARGET_DATA_DIR"
fi

# Switch to 'node' user if running as root
if [ "$(id -u)" = "0" ]; then
    echo "🔒 [ShellGuard] Dropping privileges to user 'node' (UID: $(id -u node))..."
    exec su-exec node "$@"
else
    exec "$@"
fi
