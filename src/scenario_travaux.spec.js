import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Tests de la purge ciblée d'un scénario de travaux (option `elementsModifies` de calcul_3cl).
 * `tv` et `isEffetJoule` sont mockés : le statut effet Joule des lignes de tables et du logement
 * est piloté par chaque test.
 */
vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  isEffetJoule: vi.fn()
}));

const {
  TYPES_ELEMENTS,
  aDesElementsModifies,
  parseElementsModifies,
  trouverElements,
  purgerCaracteristiquesCombustion,
  purgerTemperaturesFonctionnement,
  purgerFichesTechniquesGenerateur,
  purgerLignesEffetJoule,
  effetJouleAvantTravaux,
  appliquerElementsModifies
} = await import('./scenario_travaux.js');
const { tv, isEffetJoule } = await import('./utils.js');

let warn;

beforeEach(() => {
  vi.mocked(tv).mockReset();
  vi.mocked(isEffetJoule).mockReset();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

const combustionDi = () => ({
  pn: 24000,
  rpn: 0.9,
  rpint: 0.88,
  qp0: 150,
  temp_fonc_30: 48.5,
  temp_fonc_100: 80,
  pveilleuse: 100,
  conso_ch: 1234
});

/** DPE minimal : 2 murs, 1 plancher bas, 1 plancher haut, 1 baie, 1 porte, 1 ventilation. */
function makeDpe() {
  return {
    fiche_technique_collection: {
      fiche_technique: [
        {
          enum_categorie_fiche_technique_id: '7',
          sous_fiche_technique_collection: {
            sous_fiche_technique: [
              { description: 'Type de générateur', valeur: 'Chaudière gaz basse température' },
              { description: 'Présence d’une veilleuse', valeur: 'oui' },
              { description: 'Type de générateur', valeur: 'Poêle bois' },
              { description: 'Année', valeur: '2010' }
            ]
          }
        },
        {
          enum_categorie_fiche_technique_id: '8',
          sous_fiche_technique_collection: {
            sous_fiche_technique: [
              { description: 'Type de générateur', valeur: 'Chauffe-eau gaz' },
              { description: 'Présence d’une veilleuse', valeur: 'oui' }
            ]
          }
        }
      ]
    },
    logement: {
      enveloppe: {
        mur_collection: {
          mur: [
            { donnee_entree: { reference: 'm1', tv_umur_id: 1, tv_umur0_id: 7 } },
            { donnee_entree: { reference: 'm2', tv_umur_id: 2, tv_umur0_id: 7 } }
          ]
        },
        plancher_bas_collection: {
          plancher_bas: [{ donnee_entree: { reference: 'pb1', tv_upb_id: 3 } }]
        },
        plancher_haut_collection: {
          plancher_haut: [{ donnee_entree: { reference: 'ph1', tv_uph_id: 4 } }]
        },
        baie_vitree_collection: {
          baie_vitree: [{ donnee_entree: { reference: 'bv1', tv_coef_transparence_ets_id: 9 } }]
        },
        porte_collection: { porte: [{ donnee_entree: { reference: 'p1', presence_joint: 1 } }] }
      },
      ventilation_collection: {
        ventilation: [{ donnee_entree: { reference: 'v1', tv_q4pa_conv_id: 1 } }]
      },
      installation_chauffage_collection: {
        installation_chauffage: [
          {
            generateur_chauffage_collection: {
              generateur_chauffage: [
                {
                  donnee_entree: {
                    reference: 'g1',
                    description: 'Chaudière gaz basse température',
                    enum_methode_saisie_carac_sys_id: '1'
                  },
                  donnee_intermediaire: combustionDi()
                }
              ]
            },
            emetteur_chauffage_collection: {
              emetteur_chauffage: [
                {
                  donnee_entree: {
                    reference: 'e1',
                    tv_intermittence_id: 12,
                    tv_rendement_distribution_ch_id: 5,
                    enum_type_emission_distribution_id: '41'
                  }
                }
              ]
            }
          },
          {
            generateur_chauffage_collection: {
              generateur_chauffage: [
                {
                  donnee_entree: { reference: 'g2', description: 'Poêle bois' },
                  donnee_intermediaire: combustionDi()
                }
              ]
            },
            emetteur_chauffage_collection: {
              emetteur_chauffage: [
                {
                  donnee_entree: {
                    reference: 'e2',
                    tv_intermittence_id: 13,
                    tv_rendement_distribution_ch_id: 6,
                    enum_type_emission_distribution_id: '10'
                  }
                }
              ]
            }
          }
        ]
      },
      installation_ecs_collection: {
        installation_ecs: [
          {
            donnee_entree: { reference: 'i1', tv_rendement_distribution_ecs_id: 2 },
            generateur_ecs_collection: {
              generateur_ecs: [
                {
                  donnee_entree: { reference: 'ge1', description: 'Chauffe-eau gaz' },
                  donnee_intermediaire: { ...combustionDi(), rendement_generation_stockage: 0.75 }
                }
              ]
            }
          }
        ]
      }
    }
  };
}

describe('aDesElementsModifies', () => {
  test('option absente ou tableau vide : aucune purge (comportement inchangé)', () => {
    expect(aDesElementsModifies(undefined)).toBe(false);
    expect(aDesElementsModifies([])).toBe(false);
  });

  test('tableau non vide ou valeur invalide : passage par la purge (qui avertit)', () => {
    expect(aDesElementsModifies(['mur:m1'])).toBe(true);
    expect(aDesElementsModifies('mur:m1')).toBe(true);
  });
});

describe('parseElementsModifies', () => {
  test('regroupe les références par type et dédoublonne', () => {
    const res = parseElementsModifies(['mur:m1', 'mur:m2', 'mur:m1', 'porte:a:b']);
    expect([...res.get('mur')]).toEqual(['m1', 'm2']);
    // seule la première occurrence de « : » sépare le type de la référence
    expect([...res.get('porte')]).toEqual(['a:b']);
    expect(warn).not.toHaveBeenCalled();
  });

  test('avertit et ignore les identifiants mal formés ou de type inconnu', () => {
    const res = parseElementsModifies(['toiture:x', ':m1', 'm1', 42]);
    expect(res.size).toBe(0);
    expect(warn).toHaveBeenCalledTimes(4);
    expect(warn.mock.calls[0][0]).toContain("identifiant 'toiture:x' non reconnu");
  });

  test('accepte une référence vide (élément exporté sans référence)', () => {
    const res = parseElementsModifies(['generateur_chauffage:']);
    expect([...res.get('generateur_chauffage')]).toEqual(['']);
    expect(warn).not.toHaveBeenCalled();
  });

  test("avertit et ignore l'option si ce n'est pas un tableau", () => {
    expect(parseElementsModifies('mur:m1').size).toBe(0);
    expect(warn.mock.calls[0][0]).toContain('doit être un tableau');
  });
});

describe('TYPES_ELEMENTS', () => {
  test('accepte un élément unique non encapsulé dans un tableau et des collections absentes', () => {
    const logement = {
      enveloppe: { mur_collection: { mur: { donnee_entree: { reference: 'm1' } } } }
    };
    expect(TYPES_ELEMENTS.mur(logement)).toHaveLength(1);
    expect(TYPES_ELEMENTS.porte(logement)).toEqual([]);
    expect(TYPES_ELEMENTS.generateur_chauffage(logement)).toEqual([]);
    expect(TYPES_ELEMENTS.generateur_ecs({})).toEqual([]);
    expect(TYPES_ELEMENTS.plancher_bas({})).toEqual([]);
    expect(TYPES_ELEMENTS.plancher_haut({})).toEqual([]);
    expect(TYPES_ELEMENTS.baie_vitree({})).toEqual([]);
    expect(TYPES_ELEMENTS.ventilation({})).toEqual([]);
    expect(TYPES_ELEMENTS.emetteur_chauffage({})).toEqual([]);
    expect(TYPES_ELEMENTS.installation_ecs({})).toEqual([]);
  });

  test('parcourt générateurs et émetteurs de toutes les installations', () => {
    const { logement } = makeDpe();
    expect(
      TYPES_ELEMENTS.generateur_chauffage(logement).map((g) => g.donnee_entree.reference)
    ).toEqual(['g1', 'g2']);
    expect(
      TYPES_ELEMENTS.emetteur_chauffage(logement).map((e) => e.donnee_entree.reference)
    ).toEqual(['e1', 'e2']);
    expect(TYPES_ELEMENTS.generateur_ecs(logement)).toHaveLength(1);
  });
});

describe('trouverElements', () => {
  test('retrouve les éléments par donnee_entree.reference (comparaison en chaîne)', () => {
    const logement = {
      enveloppe: { mur_collection: { mur: [{ donnee_entree: { reference: 12 } }] } }
    };
    const res = trouverElements(logement, new Map([['mur', new Set(['12'])]]));
    expect(res.get('mur')).toHaveLength(1);
    expect(warn).not.toHaveBeenCalled();
  });

  test('avertit pour une référence inconnue, sans planter', () => {
    const { logement } = makeDpe();
    const res = trouverElements(logement, new Map([['mur', new Set(['inconnu'])]]));
    expect(res.get('mur')).toEqual([]);
    expect(warn.mock.calls[0][0]).toContain("aucun élément 'mur' de référence 'inconnu'");
  });

  test('avertit pour une référence dupliquée et retient tous les éléments qui la portent', () => {
    const logement = {
      enveloppe: {
        mur_collection: {
          mur: [{ donnee_entree: { reference: 'x' } }, { donnee_entree: { reference: 'x' } }, {}]
        }
      }
    };
    const res = trouverElements(logement, new Map([['mur', new Set(['x'])]]));
    expect(res.get('mur')).toHaveLength(2);
    expect(warn.mock.calls[0][0]).toContain("2 éléments 'mur' partagent la référence 'x'");
  });

  test('référence vide : retient les éléments sans référence', () => {
    const logement = {
      enveloppe: {
        mur_collection: {
          mur: [
            { donnee_entree: { reference: '' } },
            { donnee_entree: { reference: 'm1' } },
            { donnee_entree: {} }
          ]
        }
      }
    };
    const res = trouverElements(logement, new Map([['mur', new Set([''])]]));
    const murs = logement.enveloppe.mur_collection.mur;
    expect(res.get('mur')).toEqual([murs[0], murs[2]]);
    // référence absente : également retrouvée par 'undefined' (String(undefined))
    expect(
      trouverElements(logement, new Map([['mur', new Set(['undefined'])]])).get('mur')
    ).toEqual([murs[2]]);
  });

  test('paroi ou menuiserie sans référence : retrouvée par la référence générée <type>_<index>', () => {
    const logement = {
      enveloppe: {
        mur_collection: { mur: [{ donnee_entree: { reference: 'M' } }, { donnee_entree: {} }] }
      },
      ventilation_collection: { ventilation: [{ donnee_entree: {} }] }
    };
    const murs = logement.enveloppe.mur_collection.mur;
    expect(trouverElements(logement, new Map([['mur', new Set(['mur_1'])]])).get('mur')).toEqual([
      murs[1]
    ]);
    // référence renseignée : la référence générée ne s'applique pas
    expect(trouverElements(logement, new Map([['mur', new Set(['mur_0'])]])).get('mur')).toEqual(
      []
    );
    // hors enveloppe : pas de référence générée
    expect(
      trouverElements(logement, new Map([['ventilation', new Set(['ventilation_0'])]])).get(
        'ventilation'
      )
    ).toEqual([]);
  });
});

describe('purgerCaracteristiquesCombustion', () => {
  test('valeurs forfaitaires (méthode 1) : purge pn, rpn, rpint, qp0, temp_fonc_30/100, pveilleuse', () => {
    const g = {
      donnee_entree: { enum_methode_saisie_carac_sys_id: '1' },
      donnee_intermediaire: combustionDi()
    };
    purgerCaracteristiquesCombustion(g);
    expect(g.donnee_intermediaire).toEqual({ conso_ch: 1234 });
  });

  test('méthode de saisie absente : traitée comme valeurs forfaitaires', () => {
    const g = { donnee_entree: {}, donnee_intermediaire: combustionDi() };
    purgerCaracteristiquesCombustion(g);
    expect(g.donnee_intermediaire).toEqual({ conso_ch: 1234 });
  });

  test.each([
    ['2', { pn: 24000 }],
    ['3', { pn: 24000, rpn: 0.9, rpint: 0.88 }],
    ['4', { pn: 24000, rpn: 0.9, rpint: 0.88, qp0: 150 }],
    ['5', { pn: 24000, rpn: 0.9, rpint: 0.88, qp0: 150, temp_fonc_30: 48.5, temp_fonc_100: 80 }]
  ])(
    'méthode %s : conserve les caractéristiques saisies pour le nouveau générateur',
    (methode, gardees) => {
      const g = {
        donnee_entree: { enum_methode_saisie_carac_sys_id: methode },
        donnee_intermediaire: combustionDi()
      };
      purgerCaracteristiquesCombustion(g);
      expect(g.donnee_intermediaire).toEqual({ ...gardees, conso_ch: 1234 });
    }
  );

  test('sans donnee_intermediaire : aucune erreur', () => {
    expect(() => purgerCaracteristiquesCombustion({})).not.toThrow();
  });
});

describe('purgerTemperaturesFonctionnement', () => {
  test('purge temp_fonc_30/100 sauf si elles sont saisies (méthode 5)', () => {
    const g = {
      donnee_entree: { enum_methode_saisie_carac_sys_id: '4' },
      donnee_intermediaire: combustionDi()
    };
    purgerTemperaturesFonctionnement(g);
    expect(g.donnee_intermediaire.temp_fonc_30).toBeUndefined();
    expect(g.donnee_intermediaire.temp_fonc_100).toBeUndefined();
    expect(g.donnee_intermediaire.pn).toBe(24000);

    const saisi = {
      donnee_entree: { enum_methode_saisie_carac_sys_id: '5' },
      donnee_intermediaire: combustionDi()
    };
    purgerTemperaturesFonctionnement(saisi);
    expect(saisi.donnee_intermediaire.temp_fonc_30).toBe(48.5);
  });

  test('méthode absente : purge', () => {
    const g = { donnee_intermediaire: combustionDi() };
    purgerTemperaturesFonctionnement(g);
    expect(g.donnee_intermediaire.temp_fonc_100).toBeUndefined();
  });
});

describe('purgerFichesTechniquesGenerateur', () => {
  test('supprime le bloc du générateur jusqu’au générateur suivant, dans la seule catégorie visée', () => {
    const dpe = makeDpe();
    purgerFichesTechniquesGenerateur(dpe, 'chaudière GAZ basse', '7');
    const [ch, ecs] = dpe.fiche_technique_collection.fiche_technique;
    expect(ch.sous_fiche_technique_collection.sous_fiche_technique).toEqual([
      { description: 'Type de générateur', valeur: 'Poêle bois' },
      { description: 'Année', valeur: '2010' }
    ]);
    expect(ecs.sous_fiche_technique_collection.sous_fiche_technique).toHaveLength(2);
  });

  test('description absente ou introuvable : fiches inchangées', () => {
    const dpe = makeDpe();
    const avant = structuredClone(dpe.fiche_technique_collection);
    purgerFichesTechniquesGenerateur(dpe, undefined, '7');
    purgerFichesTechniquesGenerateur(dpe, 'pompe à chaleur', '7');
    expect(dpe.fiche_technique_collection).toEqual(avant);
  });

  test('tolère les fiches sans sous-fiches et les sous-fiches incomplètes', () => {
    const dpe = {
      fiche_technique_collection: {
        fiche_technique: [
          { enum_categorie_fiche_technique_id: 7 },
          {
            enum_categorie_fiche_technique_id: '7',
            sous_fiche_technique_collection: {
              sous_fiche_technique: [
                null,
                { valeur: 12 },
                { valeur: 'Chaudière' },
                null,
                { valeur: 'x' }
              ]
            }
          }
        ]
      }
    };
    expect(() => purgerFichesTechniquesGenerateur(dpe, 'chaudière', '7')).not.toThrow();
    expect(() => purgerFichesTechniquesGenerateur({}, 'chaudière', '7')).not.toThrow();
  });
});

describe('purgerLignesEffetJoule', () => {
  test('purge les seules lignes tv_umur / tv_upb / tv_uph au statut différent', () => {
    vi.mocked(tv).mockImplementation((table, matcher) => {
      if (table === 'umur') return { effet_joule: matcher.tv_umur_id === 1 ? '1' : '0' };
      if (table === 'upb') return { effet_joule: 1 };
      return undefined;
    });
    const { logement } = makeDpe();
    logement.enveloppe.mur_collection.mur.push({ donnee_entree: { reference: 'm3' } });
    purgerLignesEffetJoule(logement, '0');
    const env = logement.enveloppe;
    expect(env.mur_collection.mur.map((m) => m.donnee_entree.tv_umur_id)).toEqual([
      undefined,
      2,
      undefined
    ]);
    expect(env.mur_collection.mur[0].donnee_entree.tv_umur0_id).toBe(7);
    // effet_joule numérique comparé en chaîne
    expect(env.plancher_bas_collection.plancher_bas[0].donnee_entree.tv_upb_id).toBeUndefined();
    // ligne introuvable : conservée
    expect(env.plancher_haut_collection.plancher_haut[0].donnee_entree.tv_uph_id).toBe(4);
    expect(tv).toHaveBeenCalledWith('uph', { tv_uph_id: 4 });
  });
});

describe('effetJouleAvantTravaux', () => {
  test('générateurs modifiés à combustion ou PAC (identifiants repris) : statut recalculé sans eux', () => {
    vi.mocked(isEffetJoule).mockReturnValue('0');
    const { logement } = makeDpe();
    const [g1, g2] = TYPES_ELEMENTS.generateur_chauffage(logement);
    g1.donnee_entree.tv_generateur_combustion_id = 12;
    expect(effetJouleAvantTravaux(logement, [g1])).toBe('0');
    // les lignes tv_umur ne sont pas consultées
    expect(tv).not.toHaveBeenCalled();
    const [installations] = vi.mocked(isEffetJoule).mock.calls[0];
    const generateurs = installations.map(
      (i) => i.generateur_chauffage_collection.generateur_chauffage[0]
    );
    expect(generateurs[0].donnee_entree.enum_type_generateur_ch_id).toBe('non_joule');
    expect(generateurs[1]).toBe(g2);

    g2.donnee_entree.tv_scop_id = 3;
    effetJouleAvantTravaux(logement, [g2]);
    expect(isEffetJoule).toHaveBeenCalledTimes(2);
  });

  test('installation sans générateurs : tolérée', () => {
    vi.mocked(isEffetJoule).mockReturnValue('0');
    const { logement } = makeDpe();
    logement.installation_chauffage_collection.installation_chauffage.push({});
    const g1 = TYPES_ELEMENTS.generateur_chauffage(logement)[0];
    g1.donnee_entree.tv_generateur_combustion_id = 12;
    expect(effetJouleAvantTravaux(logement, [g1])).toBe('0');
  });

  test('type d’origine non déductible : statut inconnu', () => {
    const { logement } = makeDpe();
    expect(effetJouleAvantTravaux(logement, [{ donnee_entree: {} }])).toBeUndefined();
    expect(isEffetJoule).not.toHaveBeenCalled();
  });
});

describe('appliquerElementsModifies', () => {
  test('liste vide : aucune modification du DPE', () => {
    const dpe = makeDpe();
    const avant = structuredClone(dpe);
    expect(appliquerElementsModifies(dpe, [])).toBe(0);
    expect(dpe).toEqual(avant);
  });

  test('isolation de mur : purge tv_q4pa_conv_id de la ventilation, conserve le reste', () => {
    const dpe = makeDpe();
    const avant = structuredClone(dpe);
    expect(appliquerElementsModifies(dpe, ['mur:m1'])).toBe(1);
    expect(
      dpe.logement.ventilation_collection.ventilation[0].donnee_entree.tv_q4pa_conv_id
    ).toBeUndefined();
    // le reste du DPE est inchangé (structure du mur, autres parois, systèmes)
    delete avant.logement.ventilation_collection.ventilation[0].donnee_entree.tv_q4pa_conv_id;
    expect(dpe).toEqual(avant);
  });

  test.each(['plancher_bas:pb1', 'plancher_haut:ph1', 'porte:p1', 'ventilation:v1'])(
    '%s : purge tv_q4pa_conv_id',
    (id) => {
      const dpe = makeDpe();
      appliquerElementsModifies(dpe, [id]);
      expect(
        dpe.logement.ventilation_collection.ventilation[0].donnee_entree.tv_q4pa_conv_id
      ).toBeUndefined();
      expect(warn).not.toHaveBeenCalled();
    }
  );

  test('menuiserie remplacée sans presence_joint : purge et avertissement', () => {
    const dpe = makeDpe();
    appliquerElementsModifies(dpe, ['baie_vitree:bv1']);
    expect(
      dpe.logement.ventilation_collection.ventilation[0].donnee_entree.tv_q4pa_conv_id
    ).toBeUndefined();
    expect(
      dpe.logement.enveloppe.baie_vitree_collection.baie_vitree[0].donnee_entree
        .tv_coef_transparence_ets_id
    ).toBe(9);
    expect(warn.mock.calls[0][0]).toContain("'baie_vitree:bv1' sans presence_joint");

    warn.mockClear();
    const dpe2 = makeDpe();
    dpe2.logement.enveloppe.porte_collection.porte[0].donnee_entree.presence_joint = '';
    appliquerElementsModifies(dpe2, ['porte:p1']);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test('seules des menuiseries remplacées, ligne q4pa_conv « surfaces isolées » : ligne conservée', () => {
    vi.mocked(tv).mockReturnValue({ tv_q4pa_conv_id: '10', isolation_surfaces: '1' });
    const dpe = makeDpe();
    appliquerElementsModifies(dpe, ['porte:p1']);
    expect(tv).toHaveBeenCalledWith('q4pa_conv', { tv_q4pa_conv_id: 1 });
    expect(dpe.logement.ventilation_collection.ventilation[0].donnee_entree.tv_q4pa_conv_id).toBe(
      1
    );

    // une paroi opaque modifiée en même temps : la ligne est purgée
    const dpe2 = makeDpe();
    appliquerElementsModifies(dpe2, ['porte:p1', 'mur:m1']);
    expect(
      dpe2.logement.ventilation_collection.ventilation[0].donnee_entree.tv_q4pa_conv_id
    ).toBeUndefined();

    // ventilation modifiée : la ligne est purgée
    const dpe3 = makeDpe();
    appliquerElementsModifies(dpe3, ['porte:p1', 'ventilation:v1']);
    expect(
      dpe3.logement.ventilation_collection.ventilation[0].donnee_entree.tv_q4pa_conv_id
    ).toBeUndefined();
  });

  test('ligne q4pa_conv « avec joints » et menuiseries non modifiées sans presence_joint : joints reportés', () => {
    vi.mocked(tv).mockReturnValue({
      tv_q4pa_conv_id: '12',
      isolation_surfaces: '0',
      presence_joints_menuiserie: '1'
    });
    const dpe = makeDpe();
    dpe.logement.enveloppe.porte_collection.porte[0].donnee_entree.presence_joint = 1;
    appliquerElementsModifies(dpe, ['porte:p1']);
    expect(
      dpe.logement.ventilation_collection.ventilation[0].donnee_entree.tv_q4pa_conv_id
    ).toBeUndefined();
    expect(
      dpe.logement.enveloppe.baie_vitree_collection.baie_vitree[0].donnee_entree.presence_joint
    ).toBe(1);

    // une menuiserie non modifiée renseigne presence_joint : rien n'est reporté
    const dpe2 = makeDpe();
    appliquerElementsModifies(dpe2, ['mur:m1']);
    expect(
      dpe2.logement.enveloppe.baie_vitree_collection.baie_vitree[0].donnee_entree.presence_joint
    ).toBeUndefined();
  });

  test('ligne q4pa_conv sans critère joints : presence_joint non reporté', () => {
    vi.mocked(tv).mockReturnValue({ tv_q4pa_conv_id: '1', isolation_surfaces: '0' });
    const dpe = makeDpe();
    appliquerElementsModifies(dpe, ['porte:p1']);
    expect(
      dpe.logement.enveloppe.baie_vitree_collection.baie_vitree[0].donnee_entree.presence_joint
    ).toBeUndefined();

    // ventilation sans tv_q4pa_conv_id : pas de recherche de ligne
    vi.mocked(tv).mockClear();
    const dpe2 = makeDpe();
    delete dpe2.logement.ventilation_collection.ventilation[0].donnee_entree.tv_q4pa_conv_id;
    appliquerElementsModifies(dpe2, ['mur:m1']);
    expect(tv).not.toHaveBeenCalledWith('q4pa_conv', expect.anything());
  });

  test('référence inconnue seule : avertissement et DPE inchangé', () => {
    const dpe = makeDpe();
    const avant = structuredClone(dpe);
    expect(appliquerElementsModifies(dpe, ['mur:zz'])).toBe(0);
    expect(dpe).toEqual(avant);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test('générateur de chauffage remplacé (sans changement effet Joule) : caractéristiques et fiche purgées', () => {
    vi.mocked(tv).mockReturnValue({ effet_joule: '0' });
    vi.mocked(isEffetJoule).mockReturnValue('0');
    const dpe = makeDpe();
    appliquerElementsModifies(dpe, ['generateur_chauffage:g1']);
    const [inst1, inst2] = dpe.logement.installation_chauffage_collection.installation_chauffage;
    expect(
      inst1.generateur_chauffage_collection.generateur_chauffage[0].donnee_intermediaire
    ).toEqual({
      conso_ch: 1234
    });
    // le générateur non déclaré conserve ses valeurs reprises
    expect(
      inst2.generateur_chauffage_collection.generateur_chauffage[0].donnee_intermediaire
    ).toEqual(combustionDi());
    expect(
      dpe.fiche_technique_collection.fiche_technique[0].sous_fiche_technique_collection
        .sous_fiche_technique
    ).toHaveLength(2);
    // parois et ventilation non concernées
    expect(dpe.logement.enveloppe.mur_collection.mur[0].donnee_entree.tv_umur_id).toBe(1);
    expect(dpe.logement.ventilation_collection.ventilation[0].donnee_entree.tv_q4pa_conv_id).toBe(
      1
    );
  });

  test('passage effet Joule → autre système : purge tv_umur_id, tv_upb_id, tv_uph_id au statut Joule', () => {
    vi.mocked(tv).mockReturnValue({ effet_joule: '1' });
    vi.mocked(isEffetJoule).mockReturnValue('0');
    const dpe = makeDpe();
    appliquerElementsModifies(dpe, ['generateur_chauffage:g1']);
    const env = dpe.logement.enveloppe;
    expect(env.mur_collection.mur.map((m) => m.donnee_entree.tv_umur_id)).toEqual([
      undefined,
      undefined
    ]);
    expect(env.mur_collection.mur.map((m) => m.donnee_entree.tv_umur0_id)).toEqual([7, 7]);
    expect(env.plancher_bas_collection.plancher_bas[0].donnee_entree.tv_upb_id).toBeUndefined();
    expect(env.plancher_haut_collection.plancher_haut[0].donnee_entree.tv_uph_id).toBeUndefined();
    expect(isEffetJoule).toHaveBeenCalledWith(
      dpe.logement.installation_chauffage_collection.installation_chauffage
    );
  });

  test('chaudière remplacée alors que les lignes tv_umur portent effet_joule = 1 : parois conservées', () => {
    // logiciel d'origine incohérent : la chaudière (identifiant de combustion repris) n'était pas à effet Joule
    vi.mocked(tv).mockReturnValue({ effet_joule: '1' });
    vi.mocked(isEffetJoule).mockReturnValue('0');
    const dpe = makeDpe();
    const g1 = TYPES_ELEMENTS.generateur_chauffage(dpe.logement)[0];
    g1.donnee_entree.tv_generateur_combustion_id = 12;
    appliquerElementsModifies(dpe, ['generateur_chauffage:g1']);
    expect(dpe.logement.enveloppe.mur_collection.mur[0].donnee_entree.tv_umur_id).toBe(1);
  });

  test('statut d’origine inconnu : seules les lignes au statut différent de l’après travaux sont purgées', () => {
    vi.mocked(tv).mockReturnValue({ effet_joule: '1' });
    vi.mocked(isEffetJoule).mockReturnValue('1');
    const dpe = makeDpe();
    appliquerElementsModifies(dpe, ['generateur_chauffage:g2']);
    expect(dpe.logement.enveloppe.mur_collection.mur[0].donnee_entree.tv_umur_id).toBe(1);
    vi.mocked(isEffetJoule).mockReturnValue('0');
    const dpe2 = makeDpe();
    appliquerElementsModifies(dpe2, ['generateur_chauffage:g2']);
    expect(dpe2.logement.enveloppe.mur_collection.mur[0].donnee_entree.tv_umur_id).toBeUndefined();
  });

  test('émetteur modifié : intermittence, distribution (type 41) et temp_fonc des générateurs de son installation', () => {
    const dpe = makeDpe();
    appliquerElementsModifies(dpe, ['emetteur_chauffage:e1']);
    const [inst1, inst2] = dpe.logement.installation_chauffage_collection.installation_chauffage;
    const e1 = inst1.emetteur_chauffage_collection.emetteur_chauffage[0].donnee_entree;
    expect(e1.tv_intermittence_id).toBeUndefined();
    expect(e1.tv_rendement_distribution_ch_id).toBeUndefined();
    const g1 = inst1.generateur_chauffage_collection.generateur_chauffage[0].donnee_intermediaire;
    expect(g1.temp_fonc_30).toBeUndefined();
    expect(g1.temp_fonc_100).toBeUndefined();
    expect(g1.pn).toBe(24000);
    // l'autre installation est intacte
    expect(
      inst2.emetteur_chauffage_collection.emetteur_chauffage[0].donnee_entree.tv_intermittence_id
    ).toBe(13);
    expect(
      inst2.generateur_chauffage_collection.generateur_chauffage[0].donnee_intermediaire
        .temp_fonc_30
    ).toBe(48.5);
  });

  test('émetteur hors type 41 : tv_rendement_distribution_ch_id conservé', () => {
    const dpe = makeDpe();
    appliquerElementsModifies(dpe, ['emetteur_chauffage:e2']);
    const e2 =
      dpe.logement.installation_chauffage_collection.installation_chauffage[1]
        .emetteur_chauffage_collection.emetteur_chauffage[0].donnee_entree;
    expect(e2.tv_intermittence_id).toBeUndefined();
    expect(e2.tv_rendement_distribution_ch_id).toBe(6);
  });

  test('installation de chauffage sans émetteurs ni générateurs : ignorée', () => {
    const dpe = makeDpe();
    dpe.logement.installation_chauffage_collection.installation_chauffage.push({});
    expect(() => appliquerElementsModifies(dpe, ['emetteur_chauffage:e1'])).not.toThrow();
  });

  test('générateur ECS remplacé : caractéristiques, rendement réseau de chaleur et fiche (cat. 8)', () => {
    const dpe = makeDpe();
    appliquerElementsModifies(dpe, ['generateur_ecs:ge1']);
    const inst = dpe.logement.installation_ecs_collection.installation_ecs[0];
    expect(inst.generateur_ecs_collection.generateur_ecs[0].donnee_intermediaire).toEqual({
      conso_ch: 1234
    });
    expect(inst.donnee_entree.tv_rendement_distribution_ecs_id).toBe(2);
    expect(
      dpe.fiche_technique_collection.fiche_technique[1].sous_fiche_technique_collection
        .sous_fiche_technique
    ).toEqual([]);
    expect(
      dpe.fiche_technique_collection.fiche_technique[0].sous_fiche_technique_collection
        .sous_fiche_technique
    ).toHaveLength(4);
  });

  test('distribution ECS modifiée : tv_rendement_distribution_ecs_id purgé', () => {
    const dpe = makeDpe();
    appliquerElementsModifies(dpe, ['installation_ecs:i1']);
    const inst = dpe.logement.installation_ecs_collection.installation_ecs[0];
    expect(inst.donnee_entree.tv_rendement_distribution_ecs_id).toBeUndefined();
    expect(inst.generateur_ecs_collection.generateur_ecs[0].donnee_intermediaire.pn).toBe(24000);
  });
});
