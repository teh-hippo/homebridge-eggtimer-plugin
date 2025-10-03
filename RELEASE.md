# Releasing

1. `gh release create vx.x.x --generate-notes`
1. `git checkout -b bump-version`
1. `pnpm version patch --no-git-tag-version`
1. Commit.
