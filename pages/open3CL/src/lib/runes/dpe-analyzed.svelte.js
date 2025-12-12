let analyzedDpe = $state({ code: undefined });

export function getAnalyzedDpe() {
  return analyzedDpe;
}

export function setAnalyzedDpe(newDpe) {
  analyzedDpe = newDpe;
}
