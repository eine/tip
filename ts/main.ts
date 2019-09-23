import * as core from '@actions/core';
import * as github from '@actions/github';

import { createReadStream, statSync } from 'fs';
import { basename, extname, join, isAbsolute } from 'path';
import { Glob } from 'glob';

export async function run() {
  try {
    var slug = ['user','repo']
    if (github.context.payload.repository && github.context.payload.repository.full_name) {
        slug = github.context.payload.repository.full_name.split('/')
    }
    const owner = slug[0]
    const repo = slug[1]
    const tag_name = 'tip'
    const octokit: github.GitHub = new github.GitHub(core.getInput('token', {required: true}));

    core.startGroup('Update existing tip tag...')
    const { data: new_tag } = await octokit.git.updateRef({ owner, repo, ref: 'tags/'+tag_name, sha: github.context.sha });
    console.log(new_tag);
    core.endGroup()

    core.startGroup('Get existing tip release...')
    const { data: tip_rel } = await octokit.repos.getReleaseByTag({ owner, repo, tag: tag_name });
    console.log(tip_rel);
    core.endGroup()

    core.startGroup('Remove existing tip release...')
    const { data: del } = await octokit.repos.deleteRelease({ owner, repo, release_id: tip_rel.id });
    console.log(del);
    core.endGroup()

    core.startGroup('Create new tip release...')
    const { data: release } = await octokit.repos.createRelease({ owner, repo, tag_name, name: 'tip', prerelease: true });
    console.log(release);
    core.endGroup()

    const options = {
      'json': 'text/json',
      'zip':  'application/zip',
      'txt':  'text/plain',
      'md':   'text/markdown',
      'ts':   'application/typescript',
      'gz':   'applicatiom/gzip'
    }

    const xcwd = core.getInput('cwd', {required: true});

    core.getInput('files', {required: true}).split(/[\r\n]+/).forEach(async function(item){

      Glob(item, { cwd: xcwd }, async function (er, files) {

        if (er != null) {
          core.setFailed(er.message);
          throw er;
        }

        files.forEach(async function(name){

          const file = join(xcwd, name);
          const stats = statSync(file);

          console.log('Upload ' + file + ' [size: ' + stats.size + ']...');

          await octokit.repos.uploadReleaseAsset({
            url: release.upload_url,
            headers: {
              'content-type': options[extname(file).substr(1)],
              'content-length': stats.size
            },
            name: basename(file),
            file: createReadStream(file),
          });
        });
    })

    });
  }

  catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}

run();
