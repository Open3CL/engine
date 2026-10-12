import { describe, expect, test, vi } from 'vitest';

// Dépendances lourdes du worker mockées : seul `addGenerateurs` est testé ici.
vi.mock('../../src/utils.js', () => ({
  set_bug_for_bug_compat: vi.fn(),
  set_tv_match_optimized_version: vi.fn()
}));
vi.mock('../../src/index.js', () => ({ calcul_3cl: vi.fn() }));
vi.mock('../../src/enums.js', () => ({
  default: {
    type_generateur_ecs: { 10: 'ballon électrique', 20: 'chaudière gaz ECS' },
    type_generateur_ch: { 97: 'chaudière gaz à condensation', 98: 'pompe à chaleur' }
  }
}));
vi.mock('./upload-dpe-to-object-storage.js', () => ({
  UploadDpeToObjectStorage: class {}
}));
vi.mock('./corpus_utils.js', () => ({
  DPE_PROPERTIES_TO_CHECK: [],
  DPE_PROPERTIES_TO_VALIDATE: [],
  setLoggerOff: vi.fn(),
  setLoggerOn: vi.fn()
}));

const { addGenerateurs } = await import('./corpus_worker.mjs');

/** Installation minimale portant un générateur du type donné. */
const installation = (type, enumKey, id) => ({
  [`generateur_${type}_collection`]: {
    [`generateur_${type}`]: [{ donnee_entree: { [`enum_${enumKey}_id`]: id } }]
  }
});

const dpe = (ecs, chauffage) => ({
  logement: {
    installation_ecs_collection: ecs,
    installation_chauffage_collection: chauffage
  }
});

const run = (inputDpe) => {
  const csv = ['code'];
  addGenerateurs(inputDpe, csv);
  return csv.slice(1);
};

describe('addGenerateurs (rapport corpus CSV)', () => {
  test('pousse id/label des 2 premières installations ECS puis chauffage', () => {
    const input = dpe(
      {
        installation_ecs: [
          installation('ecs', 'type_generateur_ecs', '10'),
          installation('ecs', 'type_generateur_ecs', '20')
        ]
      },
      {
        installation_chauffage: [
          installation('chauffage', 'type_generateur_ch', '97'),
          installation('chauffage', 'type_generateur_ch', '98')
        ]
      }
    );

    expect(run(input)).toEqual([
      '10',
      'ballon électrique',
      '20',
      'chaudière gaz ECS',
      '97',
      'chaudière gaz à condensation',
      '98',
      'pompe à chaleur'
    ]);
  });

  test('une seule installation : la 2e paire de colonnes est vide', () => {
    const input = dpe(
      { installation_ecs: [installation('ecs', 'type_generateur_ecs', '10')] },
      { installation_chauffage: [installation('chauffage', 'type_generateur_ch', '97')] }
    );

    expect(run(input)).toEqual([
      '10',
      'ballon électrique',
      '',
      '',
      '97',
      'chaudière gaz à condensation',
      '',
      ''
    ]);
  });

  test('sans installation ECS (collection vide "") : 4 colonnes vides, pas de décalage du chauffage', () => {
    // Cas réel : DPE immeuble 2459E2175177B (`installation_ecs_collection: ""`).
    const input = dpe('', {
      installation_chauffage: [installation('chauffage', 'type_generateur_ch', '97')]
    });

    const result = run(input);

    expect(result).toHaveLength(8);
    expect(result).toEqual(['', '', '', '', '97', 'chaudière gaz à condensation', '', '']);
  });

  test.each([
    ['collection absente', undefined],
    ['collection vide ""', ''],
    ['tableau vide', { installation_chauffage: [] }],
    ['générateurs vides', { installation_chauffage: [installation('chauffage', 'x', '1')] }],
    [
      'collection de générateurs vide',
      { installation_chauffage: [{ generateur_chauffage_collection: '' }] }
    ]
  ])('sans générateur de chauffage (%s) : 4 colonnes vides, sans exception', (_, chauffage) => {
    const input = dpe(
      { installation_ecs: [installation('ecs', 'type_generateur_ecs', '10')] },
      chauffage
    );

    expect(run(input)).toEqual(['10', 'ballon électrique', '', '', '', '', '', '']);
  });

  test('id inconnu des enums : id conservé, label vide', () => {
    const input = dpe(
      { installation_ecs: [installation('ecs', 'type_generateur_ecs', '999')] },
      undefined
    );

    expect(run(input)).toEqual(['999', '', '', '', '', '', '', '']);
  });

  test('toujours exactement 8 valeurs ajoutées, même sans aucune installation', () => {
    expect(run({ logement: {} })).toEqual(['', '', '', '', '', '', '', '']);
  });
});
