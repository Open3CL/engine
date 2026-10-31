/**
 * Typage complémentaire de `dioma` (cf. `paths` de tsconfig.json).
 *
 * Les typings de dioma exigent un `static scope` sur chaque classe injectée (`ScopedClass`), alors
 * que l'exécution applique une portée par défaut quand il est absent. Les services du moteur
 * n'en déclarent pas : `inject()` accepte donc ici toute classe instanciable (ou un `Token`).
 */
import type { Token } from '../node_modules/dioma/dist/index.js';
export * from '../node_modules/dioma/dist/index.js';

type Newable<T = any> = new (...args: any[]) => T;

export declare function inject<T extends Newable>(cls: T): InstanceType<T>;
export declare function inject<T>(token: Token<T>): T;
