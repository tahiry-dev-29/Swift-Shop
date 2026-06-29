# Agent Skill: Atomic Commit & Push GitHub Workflow

## Metadata
- **Name**: Git Workflow and Atomic Feature Commits
- **Description**: Guides the agent on how to commit changes precisely, feature by feature, when already working within a dedicated Git worktree. Prohibits bulk or single commits for multiple changes.
- **Trigger**: Tasks involving Git staging, code delivery, or pushing features to GitHub.

---

## 🌲 1. Worktree Context Verification

The environment is **already operating inside the correct feature worktree**. Do not attempt to create or switch worktrees. Simply run a sanity check to verify the active branch and state:

```bash
git worktree list
git branch --show-current
git status --short
