#!/bin/sh

set -e

gstart () {
  printf "$@\n"
}
gend () {
  :
}

if [ -n "$GITHUB_EVENT_PATH" ]; then
  export CI=true
fi

[ -n "$CI" ] && {
  gstart () {
    printf "::[group]$@\n"
    SECONDS=0
  }
  gend () {
    duration=$SECONDS
    echo '::[endgroup]'
    printf "${ANSI_GRAY}took $(($duration / 60)) min $(($duration % 60)) sec.${ANSI_NOCOLOR}\n"
  }
} || echo "INFO: not in CI"

#---

gstart "Check for uncommitted changes"
git diff --exit-code --stat -- . ':!node_modules' \
|| (echo "::[error] found changed files after build" && exit 1)
gend

gstart "Update files in branch gha-tip"
cp package.json action.yml dist/
head -`grep -n "## Development" README.md | cut -f1 -d:` README.md | sed '$d' > dist/README.md
git checkout gha-tip
mv dist/* ./
rm -rf dist
gend

gstart "Run yarn install --production"
rm -Rf node_modules
yarn install --production
rm package.json yarn.lock
gend

if ! git diff --no-ext-diff --quiet --exit-code; then
  gstart "Add changes"
  git add .
  gend

  gstart "Commit changes"
  git config --local user.email "tip@gha"
  git config --local user.name "GHA"
  git commit -a -m "update $GH_SHA"
  gend

  gstart "Push to origin"
  git remote set-url origin "$(git config --get remote.origin.url | sed 's#http.*com/#git@github.com:#g')"
  eval `ssh-agent -t 60 -s`
  echo "$GH_DEPKEY" | ssh-add -
  mkdir -p ~/.ssh/
  ssh-keyscan github.com >> ~/.ssh/known_hosts
  git push
  ssh-agent -k
  gend
fi
