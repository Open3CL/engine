import { beforeEach, describe, expect, test } from 'vitest';
import { ApplicationConfig } from './application.config.js';

/** @type {ApplicationConfig} */
let config;

describe('ApplicationConfig', () => {
  beforeEach(() => {
    config = new ApplicationConfig();
  });

  test('expose la version et l’URL du dépôt ADEME', () => {
    expect(config.ademeRepositoryVersion).toBe('fix-pont-thermique-et-warning-audit-copro');
    expect(config.ademeRepositoryUrl).toBe('https://gitlab.com/observatoire-dpe/observatoire-dpe');
  });

  test('construit l’URL du fichier des tables d’enums à partir de l’URL et de la version', () => {
    expect(config.ademeEnumTablesFileUrl).toBe(
      `${config.ademeRepositoryUrl}/-/raw/${config.ademeRepositoryVersion}/modele_donnee/enum_tables.xlsx?ref_type=tags&inline=false`
    );
  });

  test('construit l’URL du fichier des tables de valeurs', () => {
    expect(config.ademeValeurTablesFileUrl).toBe(
      `${config.ademeRepositoryUrl}/-/raw/${config.ademeRepositoryVersion}/modele_donnee/valeur_tables.xlsx?ref_type=tags&inline=false`
    );
  });

  test('expose les chemins des fichiers locaux de tables de valeurs', () => {
    expect(config.solicitationsExtFilePath).toBe('src/tv/18.2_sollicitations_ext.ods');
    expect(config.c1FilePath).toBe('src/tv/18.5_c1.ods');
    expect(config.dpeGesLimitValuesFilePath).toBe('src/tv/dpe_ges_limit_values.ods');
    expect(config.assetsOutputFolder).toBe('src');
  });
});
