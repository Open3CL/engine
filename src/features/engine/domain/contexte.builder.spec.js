import { ContexteBuilder } from './contexte.builder.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TypeDpe, TypeHabitation } from '../../dpe/domain/models/type-habitation.model.js';
import { NadeqService } from './logement/nadeq.service.js';

/** @type {NadeqService} **/
let nadeqService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

describe('Generateur du contexte du calcul', () => {
  beforeEach(() => {
    nadeqService = new NadeqService();
    contexteBuilder = new ContexteBuilder(nadeqService);
  });

  test('Contexte avec effet joule', () => {
    const dpe = {
      logement: {
        caracteristique_generale: {},
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

    expect(contexteBuilder.fromDpe(dpe)).toMatchObject({
      effetJoule: true
    });
  });

  test('Contexte sans effet joule', () => {
    const dpe = {
      logement: {
        caracteristique_generale: {},
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

    expect(contexteBuilder.fromDpe(dpe)).toMatchObject({
      effetJoule: false
    });
  });

  test('Contexte sans chauffage', () => {
    const dpe = {
      logement: {
        caracteristique_generale: {}
      }
    };

    expect(contexteBuilder.fromDpe(dpe)).toMatchObject({
      effetJoule: false
    });
  });

  test('Contexte sans emetteur de chauffage', () => {
    const dpe = {
      logement: {
        caracteristique_generale: {},
        installation_chauffage_collection: {}
      }
    };

    expect(contexteBuilder.fromDpe(dpe)).toMatchObject({
      effetJoule: false
    });
  });

  test('Contexte avec calcul du nadeq', () => {
    vi.spyOn(nadeqService, 'execute').mockReturnValue(1.58);
    const dpe = {
      logement: {
        caracteristique_generale: {},
        installation_chauffage_collection: {}
      }
    };

    expect(contexteBuilder.fromDpe(dpe)).toMatchObject({
      nadeq: 1.58
    });
  });

  test('Récupération des informations du logement concerné par le DPE', () => {
    let dpe = {
      logement: {
        meteo: {
          enum_zone_climatique_id: 1,
          enum_classe_altitude_id: 2
        },
        caracteristique_generale: {
          enum_periode_construction_id: 4,
          surface_habitable_logement: 48.9,
          surface_habitable_immeuble: 105,
          hsp: 2.8,
          nombre_appartement: 18
        }
      }
    };

    dpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id = '1';
    expect(contexteBuilder.fromDpe(dpe)).toMatchObject({
      surfaceHabitable: dpe.logement.caracteristique_generale.surface_habitable_logement,
      typeHabitation: TypeHabitation.MAISON,
      typeDpe: TypeDpe.MAISON,
      enumPeriodeConstructionId: '4',
      hauteurSousPlafond: 2.8,
      nombreAppartement: 18,
      zoneClimatique: {
        id: '1',
        value: 'h1a'
      },
      altitude: {
        id: '2',
        value: '400-800m'
      }
    });

    dpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id = '5';
    dpe.logement.meteo.enum_zone_climatique_id = '4';
    dpe.logement.meteo.enum_classe_altitude_id = '3';
    expect(contexteBuilder.fromDpe(dpe)).toMatchObject({
      surfaceHabitable: dpe.logement.caracteristique_generale.surface_habitable_logement,
      typeHabitation: TypeHabitation.APPARTEMENT,
      typeDpe: TypeDpe.APPARTEMENT,
      zoneClimatique: {
        id: '4',
        value: 'h2a'
      },
      altitude: {
        id: '3',
        value: 'supérieur à 800m'
      }
    });

    dpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id = '8';
    expect(contexteBuilder.fromDpe(dpe)).toMatchObject({
      surfaceHabitable: dpe.logement.caracteristique_generale.surface_habitable_immeuble,
      typeHabitation: TypeHabitation.IMMEUBLE,
      typeDpe: TypeDpe.IMMEUBLE
    });
  });
});
