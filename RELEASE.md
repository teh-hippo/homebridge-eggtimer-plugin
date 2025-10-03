# Releasing

1. `gh release create vx.x.x --generate-notes`
1. `git checkout -b bump-version; pnpm version patch --no-git-tag-version; git add -A; git commit -m "Bump version."`
1. Push and create PR.
