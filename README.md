**tip** is a JavaScript action with TypeScript compile time support, unit testing with Jest and using the GitHub Actions Toolkit. **tip** allows to keep a pre-release named `tip` up to date with a given branch. Combined with a workflow that is executed periodically, **tip** allows to provide a fixed release name for users willing to use daily/nightly artifacts of a project.

The following block shows a minimal YAML workflow file:

```yml
name: 'workflow'

on:
  schedule:
    - cron: '0 0 * * 5'

jobs:
  mwe:
    runs-on: ubuntu-latest
    steps:

    # Clone repository
    - uses: actions/checkout@v1

    # Build your application, tool, artifacts, etc.
    - name: Build
      run: |
        echo "Build some tool and generate some artifacts" > artifact.txt

    # Update tag and pre-release
    # - Update (force-push) tag `tip` to the commit that is used in the workflow.
    # - Remove existing release named `tip`.
    # - Create a new release named `tip` that points to tag `tip`.
    # - Upload artifacts defined by the user.
    - uses: 1138-4EB/tip@gha-tip
      with:
        token:  ${{ secrets.GITHUB_TOKEN }}
        cwd: ${{ github.workspace }}
        files: |
          artifact.txt
          README.md
```

Note that the tag and the pre-release need to be created manually the first time. The workflow above will fail if the release does not exist.

## Development

`master` branch of this repository contains the sources of this action. However, these need to be compiled. A job in workflow `push.yml` is used to update branch `gha-tip` after each push that passes the tests. This kind of *auto-updated* branches need to be manually created the first time:

```bash
git checkout -b <release branch name>

rm -Rf node_modules
git rm -rf *.json *config.js *.lock .github .gitignore __tests__ ts
git add dist
git mv dist/* ./
git add .

git commit -am <release message>
git push origin <release branch name>
```

> NOTE: this procedure is based on https://github.com/actions/typescript-action#publish-to-a-distribution-branch

### Set up deploy keys

A 'Deploy key' pair needs to be configured in order to automatically `git push` branch `gha-tip`:

```sh
ssh-keygen -t ed25519
```
- Repository 'Settings':
  - Add public key to 'Deploy keys'.
  - Add private key as 'GHA_DEPLOY_KEY' in 'Secrets'.
