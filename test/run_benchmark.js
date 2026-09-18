import { getAdemeFileJson } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';
import { hrtime } from 'node:process';
import { set_bug_for_bug_compat, set_tv_match_optimized_version } from '../src/utils.js';
import DpeSanitizerService from '../src/dpe-sanitizer.service.js';

set_tv_match_optimized_version();
set_bug_for_bug_compat();

const input = getAdemeFileJson('2369E2791083C');
const dpeSanitizerService = new DpeSanitizerService();
const cleanedDpe = dpeSanitizerService.execute(input);

const start_time = hrtime.bigint();
for (let i = 0; i < 200; i++) calcul_3cl(structuredClone(cleanedDpe), { sanitize: false });
const end_time = hrtime.bigint();

console.log(`Completed in ${(end_time - start_time) / 1000000n} milliseconds`);
