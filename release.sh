#!/bin/bash
# v1.0.1
branchName=$(git rev-parse --abbrev-ref HEAD)
if [ "${branchName}" != "main" ]; then
	>&2 echo "Not on the main branch"
	exit 1
fi

git pull
if [ $? -ne 0 ]; then
	>&2 echo "Pull operation failed to complete successfully"
	exit 1
fi

npm version patch && git push --tags && git push