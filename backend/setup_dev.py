#!/usr/bin/env python3
"""
Development setup script for Email Client Backend
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return None

def check_docker():
    """Check if Docker is running"""
    result = run_command("docker ps", "Checking Docker status")
    return result is not None

def start_postgres():
    """Start PostgreSQL container"""
    # Check if container already exists
    existing = run_command("docker ps -a --filter name=email-db --format '{{.Names}}'", "Checking for existing PostgreSQL container")

    if existing and "email-db" in existing:
        print("📦 PostgreSQL container exists, starting it...")
        run_command("docker start email-db", "Starting existing PostgreSQL container")
    else:
        print("📦 Creating new PostgreSQL container...")
        run_command(
            "docker run --name email-db -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:16",
            "Creating PostgreSQL container"
        )

def setup_python_env():
    """Set up Python virtual environment and install dependencies"""
    if not os.path.exists("venv"):
        run_command("python -m venv venv", "Creating virtual environment")

    # Install dependencies
    run_command("venv/bin/pip install -r requirements.txt", "Installing Python dependencies")

def run_migrations():
    """Run database migrations"""
    run_command("venv/bin/alembic upgrade head", "Running database migrations")

def main():
    """Main setup function"""
    print("🚀 Setting up Email Client Backend Development Environment")
    print("=" * 60)

    # Check prerequisites
    if not check_docker():
        print("❌ Docker is not running. Please start Docker Desktop and try again.")
        sys.exit(1)

    # Start PostgreSQL
    start_postgres()

    # Wait a moment for PostgreSQL to start
    print("⏳ Waiting for PostgreSQL to start...")
    import time
    time.sleep(5)

    # Set up Python environment
    setup_python_env()

    # Run migrations
    run_migrations()

    print("\n🎉 Development environment setup complete!")
    print("\n📋 Next steps:")
    print("1. Start the backend server: ./start.sh")
    print("2. Visit http://localhost:8000/docs for API documentation")
    print("3. Check database with: docker exec -it email-db psql -U postgres")
    print("\n🔧 Environment info:")
    print("- PostgreSQL: localhost:5432 (user: postgres, password: secret)")
    print("- Backend API: http://localhost:8000")
    print("- API Docs: http://localhost:8000/docs")

if __name__ == "__main__":
    main()