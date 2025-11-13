const nextVersion = process.env.SEMANTIC_RELEASE_NEXT_RELEASE_VERSION;

import fs from 'node:fs';

let engineFile = fs.readFileSync('src/engine.js', 'utf8').toString();
engineFile = engineFile.replace('OPEN3CL_VERSION', nextVersion);

fs.writeFileSync('src/engine.js', engineFile, 'utf8');
