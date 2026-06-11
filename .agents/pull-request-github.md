# Pull Request GitHub Workflow 🚀

Goal: Create and manage clean, documented Pull Requests ready for review, maximizing the use of the GitHub CLI (`gh`).

## 📌 Main Rules

- **One PR per Feature Branch:** Never mix changes from different features in a single PR.
- **Auto-Review:** Always check your own diff with `gh pr diff` before submitting.
- **Clear Description:** Explain the context and the "why" of the change.
- **Draft PR:** Use draft mode for work in progress to signal that the PR is not yet ready for final review.

## 🛠️ Create a Pull Request

Once your commits are ready and pushed to the remote branch:

### Automatic Mode (Recommended)

Fills the title and body from your commit messages:

```bash
gh pr create --fill --label "enhancement" --assignee "@me"
```

### Manual / Interactive Mode

```bash
gh pr create --title "feat(api): add new endpoint for orders" --body "This PR adds the POST /orders endpoint and its validation logic." --label "enhancement"
```

### Draft Mode

If you want to share your progress without requesting an immediate review:

```bash
gh pr create --draft --fill
```

## 🔍 Manage and Verify the PR

### Check status

```bash
gh pr status
```

### Verify the diff

Check what you are going to merge:

```bash
gh pr diff
```

### View on Web

Open the GitHub interface to see comments or checks:

```bash
gh pr view --web
```

## ✅ Checklist Before Merge

- [ ] Tests pass locally (`bun test`).
- [ ] The branch is up to date with the target branch (usually `main`).
- [ ] No secrets (API keys, etc.) have been committed.
- [ ] Commits have been "squashed" if necessary to keep a clean history.

## 🚀 Finalization (Merge)

Once the PR is approved and CI tests have passed:

```bash
# Merge with squash and delete the remote/local branch
gh pr merge --squash --delete-branch
```

## 💡 Useful Commands

```bash
gh pr list              # List open PRs
gh pr checkout <id>     # Switch to the branch of a specific PR
gh pr checks            # See the status of GitHub Actions workflows
gh pr review --approve  # Approve a PR from the console
```
