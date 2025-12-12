let analyzedDpe = $state({ numero_dpe: undefined });

/**
 * @return {FullDpe}
 */
export function getAnalyzedDpe() {
  return analyzedDpe;
}

export function setAnalyzedDpe(newDpe) {
  analyzedDpe = newDpe;
}
