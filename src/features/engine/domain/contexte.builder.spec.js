import { ContexteBuilder } from './contexte.builder.js';
import { beforeEach, describe, expect, test } from 'vitest';

/** @type {ContexteBuilder} **/
let contexteBuilder;

describe('Generateur du contexte du calcul', () => {
  beforeEach(() => {
    contexteBuilder = new ContexteBuilder();
  });

  test('Contexte avec effet joule', () => {
    const dpe = {
      logement: {
        meteo: { enum_zone_climatique_id: 1 },
        caracteristique_generale: {
          enum_periode_construction_id: 1,
          surface_habitable_logement: 48.9,
          surface_habitable_immeuble: 105,
          hsp: 2.8
        },
        installation_chauffage_collection: {
          installation_chauffage: [
            {
              emetteur_chauffage_collection: {
                emetteur_chauffage: [{ donnee_entree: { enum_type_emission_distribution_id: '1' } }]
              }
            }
          ]
        }
      }
    };

    expect(contexteBuilder.fromDpe(dpe)).toStrictEqual({
      effetJoule: true,
      enumPeriodeConstructionId: '1',
      zoneClimatiqueId: '1',
      hauteurSousPlafond: 2.8,
      surfaceHabitable: 105,
      typeHabitation: 'IMMEUBLE'
    });
  });

  test('Contexte sans effet joule', () => {
    const dpe = {
      logement: {
        meteo: { enum_zone_climatique_id: 1 },
        caracteristique_generale: {
          enum_periode_construction_id: 1,
          surface_habitable_logement: 48.9,
          surface_habitable_immeuble: 105,
          hsp: 2.8
        },
        installation_chauffage_collection: {
          installation_chauffage: [
            {
              emetteur_chauffage_collection: {
                emetteur_chauffage: [
                  { donnee_entree: { enum_type_emission_distribution_id: '12' } }
                ]
              }
            }
          ]
        }
      }
    };

    expect(contexteBuilder.fromDpe(dpe)).toStrictEqual({
      effetJoule: false,
      enumPeriodeConstructionId: '1',
      zoneClimatiqueId: '1',
      hauteurSousPlafond: 2.8,
      surfaceHabitable: 105,
      typeHabitation: 'IMMEUBLE'
    });
  });

  test('Contexte sans chauffage', () => {
    const dpe = {
      logement: {
        meteo: { enum_zone_climatique_id: 1 },
        caracteristique_generale: {
          enum_periode_construction_id: 1,
          surface_habitable_logement: 48.9,
          surface_habitable_immeuble: 105,
          hsp: 2.8
        }
      }
    };

    expect(contexteBuilder.fromDpe(dpe)).toStrictEqual({
      effetJoule: false,
      enumPeriodeConstructionId: '1',
      zoneClimatiqueId: '1',
      hauteurSousPlafond: 2.8,
      surfaceHabitable: 105,
      typeHabitation: 'IMMEUBLE'
    });
  });

  test('Contexte sans emetteur de chauffage', () => {
    const dpe = {
      logement: {
        meteo: { enum_zone_climatique_id: 1 },
        caracteristique_generale: {
          enum_periode_construction_id: 1,
          surface_habitable_logement: 48.9,
          surface_habitable_immeuble: 105,
          hsp: 2.8
        },
        installation_chauffage_collection: {}
      }
    };

    expect(contexteBuilder.fromDpe(dpe)).toStrictEqual({
      effetJoule: false,
      enumPeriodeConstructionId: '1',
      zoneClimatiqueId: '1',
      hauteurSousPlafond: 2.8,
      surfaceHabitable: 105,
      typeHabitation: 'IMMEUBLE'
    });
  });

  test('Récupération de la surface habitable du logement concerné par le DPE', () => {
    let dpe = {
      logement: {
        caracteristique_generale: {
          enum_periode_construction_id: 1,
          surface_habitable_logement: 48.9,
          surface_habitable_immeuble: 105,
          hsp: 2.8
        }
      }
    };

    dpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id = '1';
    expect(contexteBuilder.fromDpe(dpe)).toMatchObject({
      surfaceHabitable: dpe.logement.caracteristique_generale.surface_habitable_logement
    });

    dpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id = '5';
    expect(contexteBuilder.fromDpe(dpe)).toMatchObject({
      surfaceHabitable: dpe.logement.caracteristique_generale.surface_habitable_logement
    });

    dpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id = '8';
    expect(contexteBuilder.fromDpe(dpe)).toMatchObject({
      surfaceHabitable: dpe.logement.caracteristique_generale.surface_habitable_immeuble
    });
  });
});
