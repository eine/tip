import * as core from '@actions/core';
import * as github from '@actions/github';

import { createReadStream, statSync } from 'fs';
import { basename, join } from 'path';
import { Glob } from 'glob';

import * as readChunk from 'read-chunk';
// FIXME Is it possible to import 'file-type'? e.g.:
// import * as fileType from 'file-type';
const fileType = require('file-type');

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

    const xcwd = core.getInput('cwd', {required: true});

    core.getInput('files', {required: true}).split(/[\r\n]+/).forEach(async function(item){
      Glob(item, { cwd: xcwd }, async function (er, files) {
        if (er != null) {
          core.setFailed(er.message);
          throw er;
        }
        if (!files.length) {
          console.log('WARNING! Glob pattern <' + item + '> produced an empty file list');
        }
        files.forEach(async function(name){
          const file = join(xcwd, name);
          const stats = statSync(file);
          const fsize = stats.size;
          var fmime = 'application/octet-stream'
          if (fsize >= fileType.minimumBytes) {
            // FIXME Can we use some built-in feature instead of depending on 'read-chunk'?
            const buffer = readChunk.sync(file, 0, fileType.minimumBytes);
            if (fileType(buffer)) {
              fmime = fileType(buffer).mime
            }
          }
          console.log('Upload ' + file + ' [size: ' + fsize + ', type:' + fmime + ']...');
          await octokit.repos.uploadReleaseAsset({
            url: release.upload_url,
            headers: {
              'content-type': fmime,
              'content-length': fsize
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
