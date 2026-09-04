import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      // On ne mesure que le vrai code métier de src/.
      all: true,
      include: ['src/**/*.js'],
      exclude: [
        // Specs eux-mêmes.
        '**/*.spec.js',
        // Modèles / définitions de types TypeScript (pas de logique métier à tester).
        '**/*.model.ts',
        // Barrel du package (simple ré-export public).
        'src/index.js',
        // Fichier mort/cassé (cf. CLAUDE.md, présent dans .eslintignore).
        'src/output.js'
      ],
      reporter: ['text', 'json', 'html'],
      // Verrou : toute baisse de couverture fait échouer la CI.
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
});
