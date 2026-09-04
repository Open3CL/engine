import { beforeEach, describe, expect, test, vi } from 'vitest';

// Isolation : on mocke le pré-processeur importé par le service afin de tester
// uniquement la logique de normalisation (clonage + délégation), sans dépendre
// du comportement réel de `DpePreProcessor` (testé dans son propre spec).
const preprocessMock = vi.fn();
vi.mock('../../../preprocessor/index.js', () => ({
  DpePreProcessor: vi.fn().mockImplementation(() => ({
    preprocess: preprocessMock
  }))
}));

const { DpeNormalizerService } = await import('./dpe-normalizer.service.js');
const { DpePreProcessor } = await import('../../../preprocessor/index.js');

describe('Normalisation des DPE (DpeNormalizerService)', () => {
  beforeEach(() => {
    preprocessMock.mockReset();
    vi.mocked(DpePreProcessor).mockClear();
  });

  test("clone le DPE d'entrée sans le muter puis délègue au pré-processeur", () => {
    const dpeOrigine = { logement: { enveloppe: { mur: [{ id: 1 }] } } };
    const service = new DpeNormalizerService();

    const normalise = service.normalize(dpeOrigine);

    // Le pré-processeur est instancié et reçoit le clone à normaliser.
    expect(DpePreProcessor).toHaveBeenCalledTimes(1);
    expect(preprocessMock).toHaveBeenCalledTimes(1);
    expect(preprocessMock).toHaveBeenCalledWith(normalise);

    // Le résultat est structurellement égal à l'entrée...
    expect(normalise).toEqual(dpeOrigine);
    // ...mais c'est bien un clone profond (aucune référence partagée).
    expect(normalise).not.toBe(dpeOrigine);
    expect(normalise.logement).not.toBe(dpeOrigine.logement);
    expect(normalise.logement.enveloppe.mur).not.toBe(dpeOrigine.logement.enveloppe.mur);
  });

  test("ne modifie pas le DPE d'origine même si le pré-processeur mute le clone", () => {
    // Le pré-processeur mocké mute le DPE reçu : l'original doit rester intact.
    preprocessMock.mockImplementation((dpe) => {
      dpe.ajoute = 'valeur';
    });
    const dpeOrigine = { a: 1 };
    const service = new DpeNormalizerService();

    const normalise = service.normalize(dpeOrigine);

    expect(normalise).toEqual({ a: 1, ajoute: 'valeur' });
    expect(dpeOrigine).toEqual({ a: 1 });
  });
});
