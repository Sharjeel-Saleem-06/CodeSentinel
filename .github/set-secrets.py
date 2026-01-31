#!/usr/bin/env python3
"""
GitHub Secrets Setup Script
Automatically sets GitHub Secrets from .env file
"""

import os
import sys
import subprocess
import json
import base64
from pathlib import Path
from nacl import encoding, public

def get_env_vars():
    """Read environment variables from .env file"""
    env_file = Path("codescan-pro/.env")
    if not env_file.exists():
        print("❌ codescan-pro/.env file not found!")
        sys.exit(1)
    
    env_vars = {}
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                if value:  # Only add non-empty values
                    env_vars[key] = value
    
    return env_vars

def encrypt_secret(public_key: str, secret_value: str) -> str:
    """Encrypt a secret using GitHub's public key"""
    public_key_bytes = base64.b64decode(public_key)
    public_key_obj = public.PublicKey(public_key_bytes)
    sealed_box = public.SealedBox(public_key_obj)
    encrypted = sealed_box.encrypt(secret_value.encode('utf-8'))
    return base64.b64encode(encrypted).decode('utf-8')

def get_github_public_key(repo_owner: str, repo_name: str, token: str):
    """Get GitHub repository's public key for encryption"""
    import urllib.request
    import urllib.error
    
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/actions/secrets/public-key"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github.v3+json")
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read())
            return data['key'], data['key_id']
    except urllib.error.HTTPError as e:
        print(f"❌ Error getting public key: {e}")
        if e.code == 401:
            print("   Authentication failed. Check your GitHub token.")
        elif e.code == 404:
            print("   Repository not found or you don't have access.")
        sys.exit(1)

def set_github_secret(repo_owner: str, repo_name: str, secret_name: str, secret_value: str, token: str):
    """Set a GitHub secret using the API"""
    import urllib.request
    import urllib.error
    
    # Get public key
    public_key, key_id = get_github_public_key(repo_owner, repo_name, token)
    
    # Encrypt secret
    encrypted_value = encrypt_secret(public_key, secret_value)
    
    # Set secret
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/actions/secrets/{secret_name}"
    data = json.dumps({
        "encrypted_value": encrypted_value,
        "key_id": key_id
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, method='PUT')
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github.v3+json")
    req.add_header("Content-Type", "application/json")
    
    try:
        with urllib.request.urlopen(req) as response:
            return True
    except urllib.error.HTTPError as e:
        print(f"❌ Error setting {secret_name}: {e}")
        if e.code == 401:
            print("   Authentication failed. Check your GitHub token.")
        return False

def main():
    repo_owner = "Sharjeel-Saleem-06"
    repo_name = "CodeSentinel"
    
    print("🔐 GitHub Secrets Setup")
    print("=" * 50)
    
    # Try to get token from environment or GitHub CLI
    token = os.environ.get('GITHUB_TOKEN')
    
    if not token:
        # Try GitHub CLI
        try:
            result = subprocess.run(['gh', 'auth', 'token'], capture_output=True, text=True, check=True)
            token = result.stdout.strip()
            print("✅ Using GitHub CLI token")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ GitHub token not found!")
            print("\nPlease provide a GitHub Personal Access Token:")
            print("1. Go to: https://github.com/settings/tokens")
            print("2. Generate new token (classic) with 'repo' scope")
            print("3. Set it as environment variable: export GITHUB_TOKEN=your_token")
            print("   Or run: GITHUB_TOKEN=your_token python3 .github/set-secrets.py")
            sys.exit(1)
    
    # Get Netlify secrets (user needs to provide these)
    print("\n📋 Netlify Configuration Required:")
    netlify_token = os.environ.get('NETLIFY_AUTH_TOKEN')
    netlify_site_id = os.environ.get('NETLIFY_SITE_ID')
    
    if not netlify_token:
        print("⚠️  NETLIFY_AUTH_TOKEN not set. Skipping Netlify secrets.")
        print("   Get it from: https://app.netlify.com/user/applications")
    if not netlify_site_id:
        print("⚠️  NETLIFY_SITE_ID not set. Skipping Netlify secrets.")
        print("   Get it from: Netlify Dashboard → Site settings → General")
    
    # Read .env file
    print("\n📖 Reading codescan-pro/.env...")
    env_vars = get_env_vars()
    print(f"✅ Found {len(env_vars)} environment variables")
    
    # Set secrets
    print("\n🔑 Setting GitHub Secrets...")
    success_count = 0
    fail_count = 0
    
    # Set API key secrets
    for key, value in env_vars.items():
        if key.startswith('VITE_'):
            print(f"   Setting {key}...", end=' ')
            if set_github_secret(repo_owner, repo_name, key, value, token):
                print("✅")
                success_count += 1
            else:
                print("❌")
                fail_count += 1
    
    # Set Netlify secrets if provided
    if netlify_token:
        print(f"   Setting NETLIFY_AUTH_TOKEN...", end=' ')
        if set_github_secret(repo_owner, repo_name, "NETLIFY_AUTH_TOKEN", netlify_token, token):
            print("✅")
            success_count += 1
        else:
            print("❌")
            fail_count += 1
    
    if netlify_site_id:
        print(f"   Setting NETLIFY_SITE_ID...", end=' ')
        if set_github_secret(repo_owner, repo_name, "NETLIFY_SITE_ID", netlify_site_id, token):
            print("✅")
            success_count += 1
        else:
            print("❌")
            fail_count += 1
    
    print("\n" + "=" * 50)
    print(f"✅ Successfully set: {success_count} secrets")
    if fail_count > 0:
        print(f"❌ Failed: {fail_count} secrets")
    print("\n🎉 Done! Your GitHub Actions workflow will now use these secrets.")

if __name__ == "__main__":
    # Check if nacl is installed
    try:
        from nacl import encoding, public
    except ImportError:
        print("❌ PyNaCl library required!")
        print("   Install it: pip3 install pynacl")
        sys.exit(1)
    
    main()
