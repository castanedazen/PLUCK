PLUCK Safe Swoop 1 Patch

What it adds:
- a new /input page for real supply and shortage entry
- automatic App.tsx import + route insertion
- backup of App.tsx before changes

Run:
cd /workspaces/PLUCK
unzip -o pluck_swoop1_safe_patch.zip -d /workspaces/PLUCK/pluck_swoop1_safe_patch
bash /workspaces/PLUCK/pluck_swoop1_safe_patch/scripts/apply-safe-swoop1.sh /workspaces/PLUCK
cd /workspaces/PLUCK/client
npm run dev -- --host 0.0.0.0
