import { describe, test } from 'vitest';

/**
 * Certains tests ne sont pas des tests unitaires isolés : ils s'appuient sur le corpus DPE réel
 * (fixtures `test/fixtures/*.json`, `test/corpus-sano.json`, CSV de corpus) ou fixent des valeurs
 * de régression couplées au moteur de calcul. Ils sont donc exclus du run unitaire par défaut
 * (et de la CI) pour ne dépendre que de tests déterministes et isolés.
 *
 * Pour les exécuter explicitement :
 *   RUN_INTEGRATION_TESTS=1 npx vitest run <spec>
 * ou via le script `npm run test:integration`.
 */
const runIntegration = !!process.env.RUN_INTEGRATION_TESTS;

/** `describe` actif uniquement en mode intégration, sinon `describe.skip`. */
export const describeIntegration = runIntegration ? describe : describe.skip;

/** `test` actif uniquement en mode intégration, sinon `test.skip`. */
export const testIntegration = runIntegration ? test : test.skip;
