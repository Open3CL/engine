import { describe, expect, test } from 'vitest';
import { NadeqService } from './nadeq.service.js';
import { TypeDpe } from '../../../dpe/domain/models/type-habitation.model.js';

describe('Nadeq unit tests', () => {
  /**
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf Page 70
   */
  const service = new NadeqService();

  test.each([
    { surfaceHabitable: 8, expectedNadeq: 1 },
    { surfaceHabitable: 28, expectedNadeq: 1 },
    { surfaceHabitable: 45, expectedNadeq: 1.28125 },
    { surfaceHabitable: 51, expectedNadeq: 1.39375 },
    { surfaceHabitable: 70, expectedNadeq: 1.75 },
    { surfaceHabitable: 75, expectedNadeq: 1.7875 }
  ])(
    `Typologie MAISON : Nombre d'adultes équivalent $expectedNadeq pour une surface de logement $surfaceHabitable`,
    ({ expectedNadeq, surfaceHabitable }) => {
      const ctx = {
        surfaceHabitable: surfaceHabitable,
        typeDpe: TypeDpe.MAISON
      };
      expect(service.execute(ctx)).toBe(expectedNadeq);
    }
  );

  test.each([
    { surfaceHabitable: 8, expectedNadeq: 1 },
    { surfaceHabitable: 28, expectedNadeq: 1.3375 },
    { surfaceHabitable: 45, expectedNadeq: 1.65625 },
    { surfaceHabitable: 51, expectedNadeq: 1.7605 },
    { surfaceHabitable: 70, expectedNadeq: 1.96 },
    { surfaceHabitable: 75, expectedNadeq: 2.0125 }
  ])(
    `Typologie APPARTEMENT : Nombre d'adultes équivalent $expectedNadeq pour une surface de logement $surfaceHabitable`,
    ({ expectedNadeq, surfaceHabitable }) => {
      const ctx = {
        surfaceHabitable: surfaceHabitable,
        typeDpe: TypeDpe.APPARTEMENT
      };
      expect(service.execute(ctx)).toBeCloseTo(expectedNadeq, 2);
    }
  );

  test.each([
    { surfaceHabitable: 8, expectedNadeq: 1, nombreAppartement: 1 },
    { surfaceHabitable: 8, expectedNadeq: 2, nombreAppartement: 2 },
    { surfaceHabitable: 28, expectedNadeq: 1.3375, nombreAppartement: 1 },
    { surfaceHabitable: 28, expectedNadeq: 2.15, nombreAppartement: 2 },
    { surfaceHabitable: 45, expectedNadeq: 1.65625, nombreAppartement: 1 },
    { surfaceHabitable: 45, expectedNadeq: 2.46875, nombreAppartement: 2 },
    { surfaceHabitable: 51, expectedNadeq: 1.7605, nombreAppartement: 1 },
    { surfaceHabitable: 51, expectedNadeq: 2.58125, nombreAppartement: 2 },
    { surfaceHabitable: 70, expectedNadeq: 1.96, nombreAppartement: 1 },
    { surfaceHabitable: 70, expectedNadeq: 2.9375, nombreAppartement: 2 },
    { surfaceHabitable: 75, expectedNadeq: 2.0125, nombreAppartement: 1 },
    { surfaceHabitable: 75, expectedNadeq: 3.03125, nombreAppartement: 2 }
  ])(
    `Typologie IMMEUBLE : Nombre d'adultes équivalent $expectedNadeq pour une surface de logement $surfaceHabitable et un nombre d'apartement $nombreAppartement`,
    ({ expectedNadeq, surfaceHabitable, nombreAppartement }) => {
      const ctx = {
        surfaceHabitable: surfaceHabitable,
        nombreAppartement: nombreAppartement,
        typeDpe: TypeDpe.IMMEUBLE
      };
      expect(service.execute(ctx)).toBeCloseTo(expectedNadeq, 2);
    }
  );
});
