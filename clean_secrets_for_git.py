#!/usr/bin/env python3
"""
Script to clean sensitive data from git history before pushing to GitHub
"""

import os
import re
import subprocess
import sys

def run_command(cmd):
    """Run a command and return the output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        print(f"Error running command: {e}")
        return 1, "", str(e)

def clean_file(file_path, patterns):
    """Clean sensitive patterns from a file"""
    if not os.path.exists(file_path):
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        for pattern, replacement in patterns.items():
            content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Cleaned: {file_path}")
            return True
        return False
    except Exception as e:
        print(f"Error cleaning {file_path}: {e}")
        return False

def main():
    print("🧹 Cleaning sensitive data from files...")
    
    # Patterns to clean
    patterns = {
        r'sk-[a-zA-Z0-9]{20,}': 'sk-***REDACTED***',
        r'AIza[0-9A-Za-z_-]{35}': 'AIza***REDACTED***',
        r'google.*client.*secret["\']?\s*[:=]\s*["\']?[a-zA-Z0-9_-]{24,}["\']?': 'google_client_secret: "***REDACTED***"',
        r'openai.*api.*key["\']?\s*[:=]\s*["\']?sk-[a-zA-Z0-9]{20,}["\']?': 'openai_api_key: "***REDACTED***"',
        r'FCM_SERVER_KEY=.*': 'FCM_SERVER_KEY=***REDACTED***',
        r'PAYCHANGU_SECRET_KEY=.*': 'PAYCHANGU_SECRET_KEY=***REDACTED***',
        r'PAYCHANGU_WEBHOOK_SECRET=.*': 'PAYCHANGU_WEBHOOK_SECRET=***REDACTED***',
    }
    
    # Files to clean
    files_to_clean = [
        'eas.json',
        'app.config.js',
        'backend/.env.example',
        'scripts/development/test-openai.js',
        'clean_secrets_history.ps1',
        'COMPLETE_SETUP_DOCUMENTATION.md',
        'GOOGLE_OAUTH_SETUP.md',
        'GOOGLE_OAUTH_QUICK_SETUP.md',
        'GOOGLE_CLIENT_SECRET_SETUP.md',
        'GOOGLE_AUTH_ENABLEMENT_GUIDE.md',
        'GOOGLE_OAUTH_400_ERROR_FIX.md',
        'GOOGLE_OAUTH_400_DEBUG_GUIDE.md',
        'OPENAI_SETUP.md',
        'CHATBOT_INTEGRATION.md',
        'FIXES_SUMMARY.md',
        'FINAL_PAYMENT_FIX_SUMMARY.md',
    ]
    
    cleaned_count = 0
    for file_path in files_to_clean:
        if clean_file(file_path, patterns):
            cleaned_count += 1
    
    print(f"✅ Cleaned {cleaned_count} files")
    
    # Add and commit the cleaned files
    if cleaned_count > 0:
        print("📝 Committing cleaned files...")
        run_command("git add .")
        run_command('git commit -m "Clean sensitive data from files"')
        print("✅ Cleaned files committed")
    
    print("🎉 Ready to push to GitHub!")

if __name__ == "__main__":
    main()
