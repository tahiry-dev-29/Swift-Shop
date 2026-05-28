# Commit And Push GitHub Workflow

Goal: Work cleanly with GitHub using worktrees and committing changes feature by feature, one by one.

## Main Rules

- Always check the Git state before starting: `git status --short`.
- Never mix multiple features in a single commit.
- Never revert unrelated changes without an explicit request.
- Work from a dedicated branch/worktree for the feature.
- Commit only the files related to the current feature.
- Push the feature branch to GitHub when the commit is ready.

## Create a Feature Worktree

From the main repo:

```bash
git fetch origin
git worktree add ../dima-new-feature-name -b feature/feature-name
cd ../dima-new-feature-name
```

If the branch already exists:

```bash
git worktree add ../dima-new-feature-name feature/feature-name
cd ../dima-new-feature-name
```

## Commit Feature by Feature

Verify modified files:

```bash
git status --short
git diff --stat
```

Add only the files for the feature:

```bash
git add path/to/file-a path/to/file-b
```

Verify the staged diff:

```bash
git diff --cached
```

Commit with a clear message:

```bash
git commit -m "feat(scope): describe feature"
```

Examples:

```bash
git commit -m "feat(docker): add frontend compose services"
git commit -m "chore(env): split local docker production env files"
git commit -m "fix(api): listen on all interfaces in docker"
```

## Push to GitHub

First push of a branch:

```bash
git push -u origin feature/feature-name
```

Subsequent push:

```bash
git push
```

## Recommended Order for Large Series of Changes

1. Docker Infrastructure.
2. Environment Variables.
3. Backend/API.
4. Frontend Store.
5. Frontend Admin.
6. Prisma/Migrations/Seed.
7. Documentation/Scripts.

Each step should have its own commit if it contains distinct changes.

## Checklist Before Push

- `git status --short` shows only the expected files.
- `git diff --cached` matches a single feature.
- Useful tests or validations have been run.
- The commit message explains the concrete change.
- No production secrets are committed.

## Useful Commands

```bash
git worktree list
git branch --show-current
git status --short
git diff --stat
git diff --cached
git log --oneline --decorate -5
```
