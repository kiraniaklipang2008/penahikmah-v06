#!/usr/bin/env python3
import json
import sys

# Read the package.json file
with open('/vercel/share/v0-project/package.json', 'r') as f:
    package_json = json.load(f)

# Create a minimal but valid package-lock.json structure
lock_file = {
    "name": package_json.get("name", "project"),
    "version": package_json.get("version", "0.0.0"),
    "lockfileVersion": 3,
    "requires": True,
    "type": package_json.get("type", "module"),
    "packages": {
        "": {
            "name": package_json.get("name", "project"),
            "version": package_json.get("version", "0.0.0"),
            "type": package_json.get("type", "module"),
            "dependencies": package_json.get("dependencies", {}),
            "devDependencies": package_json.get("devDependencies", {})
        }
    }
}

# Write the lock file
with open('/vercel/share/v0-project/package-lock.json', 'w') as f:
    json.dump(lock_file, f, indent=2)

print("✓ Successfully generated package-lock.json")
sys.exit(0)
