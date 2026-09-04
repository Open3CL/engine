import { describe, expect, test } from 'vitest';
import { AddAdditionnalUeValuesTables } from './add-additionnal-ue-values-tables.js';
import { UPB_ADDITIONAL_VALUES } from '../../tv/infrastructure/assets/additional-ue-values.js';

/**
 * `execute` n'utilise ni le fileStore ni l'appConfig : on les passe en doubles
 * vides pour isoler la logique d'aplatissement des valeurs Ue additionnelles
 * dans la table `ue`.
 */
describe('AddAdditionnalUeValuesTables', () => {
  const buildService = () => new AddAdditionnalUeValuesTables({}, {});

  test('ajoute toutes les valeurs additionnelles dans la table ue', () => {
    const nbAttendu = UPB_ADDITIONAL_VALUES.reduce((acc, entree) => acc + entree.values.length, 0);
    const tableValues = { ue: [] };

    const resultat = buildService().execute(tableValues);

    expect(resultat).toBe(tableValues);
    expect(tableValues.ue).toHaveLength(nbAttendu);
  });

  test('préserve les valeurs déjà présentes dans la table ue', () => {
    const ligneExistante = { existant: true };
    const tableValues = { ue: [ligneExistante] };
    const nbAjoutees = UPB_ADDITIONAL_VALUES.reduce((acc, entree) => acc + entree.values.length, 0);

    buildService().execute(tableValues);

    expect(tableValues.ue[0]).toBe(ligneExistante);
    expect(tableValues.ue).toHaveLength(nbAjoutees + 1);
  });

  test('chaque ligne ajoutée fusionne les métadonnées d’adjacence et les valeurs', () => {
    const tableValues = { ue: [] };

    buildService().execute(tableValues);

    const premiereEntree = UPB_ADDITIONAL_VALUES[0];
    const premiereValeur = premiereEntree.values[0];

    expect(tableValues.ue[0]).toEqual({
      type_adjacence_plancher: premiereEntree.type_adjacence_plancher,
      enum_type_adjacence_id: premiereEntree.enum_type_adjacence_id,
      type_adjacence: premiereEntree.type_adjacence,
      enum_periode_construction_id: premiereEntree.enum_periode_construction_id,
      periode_construction: premiereEntree.periode_construction,
      '2s_p': premiereValeur['2s_p'],
      upb: premiereValeur.upb,
      ue: premiereValeur.ue
    });
  });
});
