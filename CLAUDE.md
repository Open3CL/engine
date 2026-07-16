# CLAUDE.md — Open3CL engine

Guide pour toute contribution (humaine ou assistée) au moteur de calcul DPE-3CL.
Lu à chaque séance : à respecter et à tenir à jour.

## Principes fondamentaux

1. **Tests unitaires isolés avec des mocks.** Chaque test unitaire doit être autonome : les
   dépendances (tables de valeurs, enums, utilitaires, services) sont **mockées**. Un test ne doit
   pas dépendre du contenu réel des tables/enums et doit rester vert si ces données évoluent.
2. **Couverture des tests à 100 %.** Chaque fichier de `src/` possède un fichier de test
   `<nom>.spec.js` placé **à côté** de sa source. Tout nouveau fichier source est accompagné de son
   spec dans le même commit.

## Outillage

- **Runner : [vitest](https://vitest.dev/).** `npm test` = `vitest run`. `npm run test:ci` pour la
  couverture.
- **Lint : ESLint** (`npm run qa:lint`, `npm run qa:lint:fix`).
- **Format : Prettier.** Toujours lancer `npx prettier --write <fichiers>` avant de committer.
- Avant chaque commit d'un spec : `npx vitest run <spec>` vert, `npx eslint <fichiers>` sans
  erreur, `npx prettier --check` conforme.

## Pattern de test à respecter

### Structure

- Import : `import { beforeEach, describe, expect, test, vi } from 'vitest';`
- Libellés de `describe`/`test` et commentaires **en français** (accents corrects).
- Nommage : `<source>.spec.js` à côté de la source.

### Isolation par mocks

- Mocker les dépendances importées par le module testé :
  `vi.mock('./x.js', () => ({ ... }))`.
- **Attention au type d'import** : respecter default vs nommé.
  - `import tvs from './tv.js'` (default) → mock `{ default: { ... } }`.
  - `import { tvs } from './tv.js'` (nommé) → mock `{ tvs: { ... } }`.
- `vi.mock` étant **hoisté**, importer le module testé **après** les mocks via top-level await :
  ```js
  vi.mock('./utils.js', () => ({ tv: vi.fn(), requestInput: (de, du, f) => de[f] }));
  const { default: maFonction, autreExport } = await import('./mon-module.js');
  const { tv } = await import('./utils.js'); // récupère le mock
  ```
- Réinitialiser les mocks dans `beforeEach` (`vi.mocked(fn).mockReset()` / `mock.mockReset()`).
- **Ne pas tester le comportement des utilitaires mockés** dans le spec d'un module consommateur :
  cela relève du spec de l'utilitaire lui-même (ex. `utils.spec.js`).

### Qualité des assertions (éviter les tests tautologiques)

Un test ne doit pas se contenter de figer la sortie actuelle du code (« le code fait ce qu'il
fait »). Combiner :

- **Tests de règles déterministes** : seuils, branches conditionnelles, cas nuls/limites,
  invariants documentés par la méthode 3CL. C'est le cœur de la valeur du test.
- **Valeurs de référence de régression** pour les formules numériques : calculer la valeur en
  exécutant le vrai module via
  `node --input-type=module -e "import fn from './src/....js'; ...; console.log(...)"`, puis figer
  avec `toBeCloseTo(valeur, 9)` en la **commentant** comme référence de régression.
- Vérifier aussi la **logique métier propre au fichier** (ex. le _matcher_ construit et passé à
  `tv()`), pas seulement le résultat final.
- Ajouter un commentaire `@see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §X` quand pertinent.

### Testabilité du code source

- Il est acceptable d'ajouter un `export` sur une **fonction pure interne** pour la tester
  unitairement (changement minime, sans impact comportemental). Exemples déjà en place :
  `findRanges` (`3.1_b.js`), `calc_hperm` (`4_ventilation.js`), `calc_Fj`/`calc_bvj`
  (`9_besoin_ch.js`), `qualite_isol` (`2021_04_13_qualite_isolation.js`).

## Architecture

Deux architectures cohabitent (migration progressive) :

- **Legacy** : fichiers numérotés à la racine de `src/` (ex. `3_deperdition.js`, `9_chauffage.js`),
  encore actifs via `src/engine.js`. Dépendances via imports directs (`tv.js`, `enums.js`,
  `utils.js`).
- **Nouvelle archi `features/`** : services injectés via `dioma`. Pour ces tests, imiter les specs
  voisins (`*.service.spec.js`) — souvent `vi.spyOn` sur des services injectés / doubles de test.

## Fichiers de test de référence

À consulter comme modèles avant d'écrire un nouveau spec :

- `src/3.1_b.spec.js` — mock de `utils`/`enums`, vérification du matcher construit.
- `src/15_conso_aux.spec.js` — fonction autonome + fonction dépendante mockée.
- `src/10_besoin_fr.spec.js` — règles déterministes (seuils) + valeurs de régression + délégation.
- `src/6.2_surface_sud_equivalente.spec.js` — mocks de tables et calcul multi-branches.
- `src/features/engine/domain/enveloppe/deperdition.service.spec.js` — nouvelle archi, double de
  test injecté.

## Points d'attention connus

- `src/output.js` est un fichier **mort/cassé** (identifiant orphelin `filecontent`, lève une
  `ReferenceError` à l'import ; présent dans `.eslintignore`). À nettoyer.
- La suite globale `vitest run src/` comporte des specs **préexistants** en échec, liés à des
  données/assets manquants dans l'environnement (ex. `test/corpus/corpus_dpe.csv` pour
  `csv-parser.store.spec.js`, plusieurs `features/**/*.service.spec.js`). Ne pas les confondre avec
  les régressions introduites par une contribution : vérifier l'état avant/après.
