import { describe, expect, test } from 'vitest';

/**
 * `output.js` n'est pas un module applicatif : il est exclu du lint (`.eslintignore`)
 * et ne contient qu'un identifiant orphelin `filecontent` (placeholder).
 * Son évaluation en tant que module ES lève donc une `ReferenceError`.
 * On se contente de figer ce comportement pour documenter l'état du fichier.
 */
describe('output - module placeholder non exécutable', () => {
  test("l'import du module lève une ReferenceError (identifiant non défini)", async () => {
    await expect(import('./output.js')).rejects.toThrowError(ReferenceError);
  });

  test("le message d'erreur mentionne l'identifiant `filecontent`", async () => {
    await expect(import('./output.js')).rejects.toThrowError(/filecontent/);
  });
});
