#!/bin/bash

echo "Setting up LeetHack Rust Backend..."

# Create necessary directories (using local directories for development)
mkdir -p ./opt/leethack
mkdir -p ./tmp/firecracker

# Check if running on macOS and warn about Firecracker
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "WARNING: Firecracker is not supported on macOS."
    echo "The backend will run in simulation mode for development."
    echo "For production deployment, use a Linux system with KVM support."
    
    # Create dummy files for development
    echo "Creating dummy kernel and rootfs files for development..."
    touch ./opt/leethack/vmlinux
    touch ./opt/leethack/rootfs.ext4
    chmod 644 ./opt/leethack/*
else
    echo "Detected Linux system. Checking for Firecracker..."
    
    # Check if Firecracker is installed
    if ! command -v firecracker &> /dev/null; then
        echo "Firecracker not found. Installing..."
        
        # Download and install Firecracker (for x86_64 Linux)
        FIRECRACKER_VERSION="v1.4.1"
        wget -O /tmp/firecracker.tgz \
            "https://github.com/firecracker-microvm/firecracker/releases/download/${FIRECRACKER_VERSION}/firecracker-${FIRECRACKER_VERSION}-x86_64.tgz"
        
        tar -xzf /tmp/firecracker.tgz -C /tmp/
        sudo mv /tmp/release-${FIRECRACKER_VERSION}-x86_64/firecracker-${FIRECRACKER_VERSION}-x86_64 /usr/local/bin/firecracker
        sudo chmod +x /usr/local/bin/firecracker
        
        echo "Firecracker installed successfully."
    else
        echo "Firecracker already installed."
    fi
    
    # Download or create basic kernel and rootfs
    echo "Setting up kernel and rootfs..."
    
    if [ ! -f /opt/leethack/vmlinux ]; then
        echo "Downloading kernel..."
        # This is a simplified example - in production you'd build custom kernels
        wget -O /opt/leethack/vmlinux \
            "https://github.com/firecracker-microvm/firecracker/blob/main/resources/guest_configs/microvm-kernel-x86_64-5.10.186/vmlinux-5.10.186?raw=true"
    fi
    
    if [ ! -f /opt/leethack/rootfs.ext4 ]; then
        echo "Creating basic rootfs..."
        # Create a simple ext4 filesystem with basic tools
        dd if=/dev/zero of=/opt/leethack/rootfs.ext4 bs=1M count=100
        mkfs.ext4 /opt/leethack/rootfs.ext4
        
        # Mount and populate with basic tools (simplified)
        mkdir -p /tmp/rootfs_mount
        sudo mount /opt/leethack/rootfs.ext4 /tmp/rootfs_mount
        
        # Install basic system (this is very simplified)
        # In production, you'd use debootstrap or similar
        sudo mkdir -p /tmp/rootfs_mount/{bin,etc,home,tmp,var,usr/bin}
        sudo cp /bin/bash /tmp/rootfs_mount/bin/
        sudo cp /bin/ls /tmp/rootfs_mount/bin/
        sudo cp /usr/bin/curl /tmp/rootfs_mount/usr/bin/ 2>/dev/null || echo "curl not found"
        
        sudo umount /tmp/rootfs_mount
        rmdir /tmp/rootfs_mount
    fi
    
    sudo chmod 644 /opt/leethack/*
fi

echo ""
echo "Setup complete!"
echo ""
echo "To start the backend:"
echo "  cd leethack-backend-rust"
echo "  cargo run"
echo ""
echo "The backend will be available at http://localhost:3001"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Note: Running in simulation mode on macOS."
    echo "Real Firecracker VMs require Linux with KVM support."
fi
