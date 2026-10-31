/**
 * Compléments aux typings globaux de TypeScript.
 *
 * `parseInt` / `parseFloat` sont appelés dans le moteur avec des nombres (conversion implicite
 * en chaîne, comportement JS standard) : on déclare ces surcharges plutôt que de modifier
 * chaque appel.
 */
declare function parseInt(value: string | number, radix?: number): number;
declare function parseFloat(value: string | number): number;

interface NumberConstructor {
  parseInt(value: string | number, radix?: number): number;
  parseFloat(value: string | number): number;
}
