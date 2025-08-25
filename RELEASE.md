# Releasing

1. Create Github Release with a new tag.
1. `git checkout -b bump-version`
1. `pnpm version patch --no-git-tag-version`
1. Commit.
