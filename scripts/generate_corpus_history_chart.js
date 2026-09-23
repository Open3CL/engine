#!/usr/bin/env node

/**
 * Rend la courbe d'évolution des DPE conformes par version, en petits multiples :
 * un panneau par corpus, une courbe par panneau, même échelle verticale partout
 * (0 → 10 000 DPE) pour que les corpus restent comparables entre eux.
 *
 * Deux fichiers sont produits, un par thème, assemblés dans le markdown par une
 * balise `<picture>` : GitHub ne sait pas appliquer `prefers-color-scheme` à
 * l'intérieur d'un SVG, mais sait choisir la source d'un `<picture>`.
 *
 * Source  : docs/corpus-history.json
 * Cible   : docs/corpus-history-light.svg + docs/corpus-history-dark.svg
 */

/** Palette validée : une seule teinte, l'identité venant du titre de chaque panneau. */
const THEMES = {
  light: {
    accent: '#2a78d6',
    textPrimary: '#0b0b0b',
    textSecondary: '#52514e',
    grid: '#d8d7d2',
    surface: '#ffffff'
  },
  dark: {
    accent: '#3987e5',
    textPrimary: '#ffffff',
    textSecondary: '#c3c2b7',
    grid: '#3a3a38',
    surface: '#0d1117'
  }
};

/** Géométrie de la grille de panneaux. */
const LAYOUT = {
  columns: 3,
  panelWidth: 268,
  panelHeight: 104,
  gapX: 26,
  gapY: 54,
  marginTop: 96,
  marginLeft: 46,
  marginRight: 18,
  marginBottom: 34,
  /** Échelle verticale commune : tous les corpus comptent ~10 000 DPE. */
  yMax: 10000
};

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, 'Liberation Sans', sans-serif";

/**
 * @param value {number}
 * @return {string}
 */
const fmtNum = (value) => new Intl.NumberFormat('fr-FR').format(value).replace(/ /g, ' ');

/**
 * @param text {string}
 * @return {string}
 */
const escape = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Points exploitables d'une série : les versions sans mesure pour ce corpus sont
 * ignorées, la courbe relie alors les versions encadrantes.
 *
 * @param history {{versions: {version: string, results: Object<string, {below: number}>}[]}}
 * @param corpus {string}
 * @return {{index: number, value: number}[]}
 */
function seriesOf(history, corpus) {
  return history.versions
    .map((entry, index) => ({ index, value: entry.results[corpus]?.below }))
    .filter((point) => typeof point.value === 'number');
}

/**
 * @param history {object}
 * @param corpora {{corpus: string, label: string}[]}
 * @param theme {object}
 * @return {string} document SVG complet
 */
function renderSvg(history, corpora, theme) {
  const { columns, panelWidth, panelHeight, gapX, gapY, marginTop, marginLeft, marginRight } =
    LAYOUT;
  const rows = Math.ceil(corpora.length / columns);
  const width = marginLeft + columns * panelWidth + (columns - 1) * gapX + marginRight;
  const height = marginTop + rows * panelHeight + (rows - 1) * gapY + LAYOUT.marginBottom;

  const versions = history.versions.map((entry) => entry.version);
  const lastIndex = versions.length - 1;

  /**
   * @param index {number} rang de la version
   * @return {number}
   */
  const x = (index) => (lastIndex === 0 ? 0 : (index / lastIndex) * panelWidth);

  /**
   * @param value {number} nombre de DPE conformes
   * @return {number}
   */
  const y = (value) => panelHeight - (Math.min(value, LAYOUT.yMax) / LAYOUT.yMax) * panelHeight;

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="chart-title chart-desc" font-family="${FONT}">`,
    `<title id="chart-title">DPE conformes par version, un panneau par corpus</title>`,
    `<desc id="chart-desc">Évolution du nombre de DPE sous le seuil de tolérance, des versions ${escape(versions[0])} à ${escape(versions[lastIndex])}, pour chacun des ${corpora.length} corpus. Échelle verticale commune de 0 à 10 000 DPE.</desc>`,
    `<text x="0" y="22" fill="${theme.textPrimary}" font-size="15" font-weight="600">DPE conformes par version</text>`,
    `<text x="0" y="42" fill="${theme.textSecondary}" font-size="12">Écart ≤ 5 % sur tous les contrôles bloquants · échelle commune 0 → 10 000 DPE · branche main</text>`,
    `<text x="0" y="60" fill="${theme.textSecondary}" font-size="12">${escape(versions[0])} → ${escape(versions[lastIndex])} · ${versions.length} versions</text>`
  ];

  corpora.forEach(({ corpus, label }, position) => {
    const column = position % columns;
    const row = Math.floor(position / columns);
    const originX = marginLeft + column * (panelWidth + gapX);
    const originY = marginTop + row * (panelHeight + gapY);
    const points = seriesOf(history, corpus);
    const last = points[points.length - 1];

    parts.push(`<g transform="translate(${originX} ${originY})">`);
    parts.push(
      `<text x="0" y="-20" fill="${theme.textPrimary}" font-size="12" font-weight="600">${escape(label)}</text>`
    );
    parts.push(
      `<text x="0" y="-6" fill="${theme.textSecondary}" font-size="11">${last ? `${fmtNum(last.value)} DPE conformes` : 'aucune mesure'}</text>`
    );

    // Grille : uniquement 0, 5 000 et 10 000, en trait discret.
    for (const tick of [0, 5000, 10000]) {
      parts.push(
        `<line x1="0" y1="${y(tick).toFixed(1)}" x2="${panelWidth}" y2="${y(tick).toFixed(1)}" stroke="${theme.grid}" stroke-width="1"/>`
      );
      if (column === 0) {
        parts.push(
          `<text x="-8" y="${(y(tick) + 3.5).toFixed(1)}" fill="${theme.textSecondary}" font-size="10" text-anchor="end">${tick === 0 ? '0' : `${tick / 1000}k`}</text>`
        );
      }
    }

    if (points.length) {
      const path = points
        .map(
          (point, i) =>
            `${i === 0 ? 'M' : 'L'}${x(point.index).toFixed(1)} ${y(point.value).toFixed(1)}`
        )
        .join(' ');
      parts.push(
        `<path d="${path}" fill="none" stroke="${theme.accent}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
      );
      parts.push(
        `<circle cx="${x(last.index).toFixed(1)}" cy="${y(last.value).toFixed(1)}" r="3.5" fill="${theme.accent}" stroke="${theme.surface}" stroke-width="2"/>`
      );
    }

    // Repères de version : première et dernière, sous les panneaux de la dernière ligne.
    if (row === rows - 1 || position + columns >= corpora.length) {
      parts.push(
        `<text x="0" y="${panelHeight + 16}" fill="${theme.textSecondary}" font-size="10">${escape(versions[0])}</text>`,
        `<text x="${panelWidth}" y="${panelHeight + 16}" fill="${theme.textSecondary}" font-size="10" text-anchor="end">${escape(versions[lastIndex])}</text>`
      );
    }

    parts.push('</g>');
  });

  parts.push('</svg>');
  return `${parts.join('\n')}\n`;
}

export { renderSvg, THEMES };
