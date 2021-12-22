#!/usr/bin/env node

/* avatars

  saves all the user avatars to the configured assets path + /avatars

*/

import fs from 'fs';
import path from 'path';

import fetch from 'node-fetch';

import { USER_TYPES } from '../defaults/index.js';

import { compileEnv } from '../compile-env/index.js';
import { parseConfigs } from '../parse-configs/index.js';

// --- compile env from CLI args & defaults ---

const env = compileEnv(process.argv.slice(2));

// --- parse school configs ---

const configAbsolutePath = path.join(process.cwd(), ...env.configPath);
const configs = await parseConfigs(configAbsolutePath, env);

// --- prepare assets path & directory ---

const avatarsAbsolutePath = path.join(
  process.cwd(),
  ...env.assetsPath,
  'avatars',
);
if (!fs.existsSync(avatarsAbsolutePath)) {
  fs.mkdirSync(avatarsAbsolutePath, { recursive: true });
}

// --- create an array of all unique user names across all user types ---

const uniqueUserNames = USER_TYPES.map((userType) => configs[userType])
  .filter((userType) => Array.isArray(userType))
  .flatMap((userType) => userType)
  .map((user) => user.user)
  .filter((user) => user)
  .reduce((all, next) => (all.includes(next) ? all : [...all, next]), []);

// --- fetch and save avatars ---

for (const user of uniqueUserNames) {
  const avatarPath = path.join(avatarsAbsolutePath, `${user}.jpeg`);

  // https://chrisfrew.in/blog/saving-images-in-node-js-using-fetch-with-array-buffer-and-buffer/
  fetch(`https://github.com/${user}.png?size=150`)
    .then((res) => res.arrayBuffer())
    .then((arrayBuffer) => {
      const buffer = Buffer.from(arrayBuffer);
      fs.createWriteStream(avatarPath).write(buffer);
    });
}
