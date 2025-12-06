# How to Upload This Repo to GitHub (Step by Step)

Repository to push: `https://github.com/Elimiz21/scam-dunk-re-write-codex.git`
Current branch: `work`

## Where this repo lives
- In this environment: `/workspace/new-scam-dunk-claude` (run `pwd` in the terminal to verify).
- If you don't see that path in Finder on your own Mac, clone the repo somewhere you do control (e.g., `~/Projects/scam-dunk-re-write-codex`) and run the same push commands there.
- Always run git commands from the folder that contains this file.

## Before you start
- Make sure you have a GitHub Personal Access Token (PAT) with `repo` scope. Create one via **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**.
- Open a terminal in the project root (the folder that contains this file).
- If you want the assistant to push from this environment, paste a PAT here when asked. It will only be used for the `git push` command in this session.

## Step 1 — Add the remote (only once)
```bash
git remote add origin https://github.com/Elimiz21/scam-dunk-re-write-codex.git
```
If the remote already exists, update it instead:
```bash
git remote set-url origin https://github.com/Elimiz21/scam-dunk-re-write-codex.git
```

## Step 2 — Confirm branch and remote
```bash
git status -sb      # shows you are on "work"
git remote -v       # confirms "origin" points to the URL above
```

## Step 3 — Push using your PAT
Run the push and enter your GitHub username and PAT when prompted for a password (do **not** use your regular GitHub password):
```bash
git push -u origin work
```
If two-factor auth is enabled, the PAT is still the correct "password" value.

## Step 4 — Verify on GitHub
1. Visit: https://github.com/Elimiz21/scam-dunk-re-write-codex/branches
2. Confirm the `work` branch exists and shows your latest commits.

## Step 5 — Open a pull request to main
1. Click **Compare & pull request** for `work` → `main`.
2. Add a short title and summary.
3. Click **Create pull request**.

## Troubleshooting
- **Authentication failed**: Recheck that you pasted the PAT as the password. If expired, generate a new PAT with `repo` scope.
- **Remote already exists**: Use the `git remote set-url` command above to point `origin` at the correct repo.
- **Branch name differs**: Replace `work` in the push command with your current branch name.
