PLUCK hard reset bundle

Run:
  bash apply_pluck_hard_reset.sh

This script:
- removes old surgical patch imports from client/index.html and client/src/main.tsx
- copies hard reset debug files into client/src/debug
- injects hard reset imports into client/index.html
- appends a strong CSS import into client/src/styles.css if not present
- creates backups