/**
 * Évaluation des formules tableur présentes dans les tables de valeurs.
 *
 * Remplace `mathjs` — dont seul `evaluate()` était utilisé, pour une grammaire très réduite —
 * par un analyseur dédié. mathjs tirait 113 modules (mathjs, decimal.js, fraction.js,
 * typed-function, seedrandom, @babel/runtime) et ~500 ms d'initialisation, et re-parsait la
 * chaîne de la formule à chaque appel.
 *
 * Grammaire supportée, alignée sur ce que mathjs acceptait pour ces formules :
 *   - nombres décimaux, séparateur `.` ou `,` (`0,085` ≡ `0.085`)
 *   - pourcentages : `0.6%` vaut 0.006
 *   - variables : `Pn`, `logPn`, `E`, `F`
 *   - fonction : `log10(x)`
 *   - opérateurs : `+` `-` `*` `/` `^` et parenthèses
 *   - multiplication implicite : `2 logPn` ≡ `2 * logPn`
 *
 * `^` est associatif à droite et lie plus fort que le moins unaire (`-2^2` vaut -4,
 * `2^-1` vaut 0.5), comme dans mathjs.
 *
 * Chaque formule n'est analysée qu'une fois : le résultat est une fermeture mise en cache.
 */

const VARIABLES = ['Pn', 'logPn', 'E', 'F'];
const FUNCTIONS = { log10: Math.log10 };

/* --------------------------------------------------------------------------------------- */
/* Analyse lexicale                                                                          */
/* --------------------------------------------------------------------------------------- */

/**
 * @param source {string}
 * @returns {{type: string, value: *}[]}
 */
function tokenize(source) {
  const tokens = [];
  let i = 0;

  while (i < source.length) {
    const c = source[i];

    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i += 1;
      continue;
    }

    if (c >= '0' && c <= '9') {
      let j = i;
      while (j < source.length && source[j] >= '0' && source[j] <= '9') j += 1;
      if (source[j] === '.' || source[j] === ',') {
        j += 1;
        while (j < source.length && source[j] >= '0' && source[j] <= '9') j += 1;
      }
      let value = Number(source.slice(i, j).replace(',', '.'));
      i = j;
      // Un `%` suffixant un nombre en fait une fraction : `0.6%` → 0.006.
      while (i < source.length && (source[i] === ' ' || source[i] === '\t')) i += 1;
      if (source[i] === '%') {
        value /= 100;
        i += 1;
      }
      tokens.push({ type: 'number', value });
      continue;
    }

    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < source.length && /[A-Za-z0-9_]/.test(source[j])) j += 1;
      tokens.push({ type: 'name', value: source.slice(i, j) });
      i = j;
      continue;
    }

    if ('+-*/^()'.includes(c)) {
      tokens.push({ type: c, value: c });
      i += 1;
      continue;
    }

    throw new SyntaxError(`caractère inattendu \`${c}\` dans la formule \`${source}\``);
  }

  return tokens;
}

/* --------------------------------------------------------------------------------------- */
/* Analyse syntaxique — descente récursive, produit une fermeture (scope) => number           */
/* --------------------------------------------------------------------------------------- */

/**
 * @param source {string}
 * @returns {(scope: {Pn: number, logPn: number, E: number, F: number}) => number}
 */
function parse(source) {
  const tokens = tokenize(source);
  let pos = 0;

  const peek = () => tokens[pos];
  const eat = (type) => {
    if (!tokens[pos] || tokens[pos].type !== type) {
      throw new SyntaxError(`\`${type}\` attendu dans la formule \`${source}\``);
    }
    return tokens[pos++];
  };

  /** Un jeton qui peut démarrer un facteur — sert à détecter la multiplication implicite. */
  const startsFactor = () => {
    const t = peek();
    return !!t && (t.type === 'number' || t.type === 'name' || t.type === '(');
  };

  function parseExpression() {
    let left = parseTerm();
    while (peek() && (peek().type === '+' || peek().type === '-')) {
      const op = tokens[pos++].type;
      const right = parseTerm();
      const l = left;
      left = op === '+' ? (s) => l(s) + right(s) : (s) => l(s) - right(s);
    }
    return left;
  }

  function parseTerm() {
    let left = parseUnary();
    for (;;) {
      const t = peek();
      if (t && (t.type === '*' || t.type === '/')) {
        const op = tokens[pos++].type;
        const right = parseUnary();
        const l = left;
        left = op === '*' ? (s) => l(s) * right(s) : (s) => l(s) / right(s);
      } else if (startsFactor()) {
        // multiplication implicite : `2 logPn`
        const right = parseUnary();
        const l = left;
        left = (s) => l(s) * right(s);
      } else {
        return left;
      }
    }
  }

  function parseUnary() {
    const t = peek();
    if (t && (t.type === '+' || t.type === '-')) {
      pos += 1;
      const operand = parseUnary();
      return t.type === '-' ? (s) => -operand(s) : operand;
    }
    return parsePower();
  }

  function parsePower() {
    const base = parsePrimary();
    if (peek() && peek().type === '^') {
      pos += 1;
      // associatif à droite, et l'exposant peut être signé : `(Pn)^-0.4`
      const exponent = parseUnary();
      return (s) => base(s) ** exponent(s);
    }
    return base;
  }

  function parsePrimary() {
    const t = peek();
    if (!t) throw new SyntaxError(`formule incomplète : \`${source}\``);

    if (t.type === 'number') {
      pos += 1;
      const { value } = t;
      return () => value;
    }

    if (t.type === '(') {
      pos += 1;
      const inner = parseExpression();
      eat(')');
      return inner;
    }

    if (t.type === 'name') {
      pos += 1;
      const name = t.value;

      if (peek() && peek().type === '(') {
        const fn = FUNCTIONS[name];
        if (!fn) throw new SyntaxError(`fonction inconnue \`${name}\` dans \`${source}\``);
        pos += 1;
        const arg = parseExpression();
        eat(')');
        return (s) => fn(arg(s));
      }

      if (!VARIABLES.includes(name)) {
        throw new SyntaxError(`variable inconnue \`${name}\` dans \`${source}\``);
      }
      return (s) => s[name];
    }

    throw new SyntaxError(`jeton inattendu \`${t.value}\` dans \`${source}\``);
  }

  const compiled = parseExpression();
  if (pos !== tokens.length) {
    throw new SyntaxError(`fin de formule inattendue dans \`${source}\``);
  }
  return compiled;
}

/* --------------------------------------------------------------------------------------- */
/* API                                                                                       */
/* --------------------------------------------------------------------------------------- */

const compiledFormulas = new Map();

/**
 * Compile une formule (ou la récupère depuis le cache).
 *
 * @param formula {string}
 * @returns {(scope: {Pn: number, logPn: number, E: number, F: number}) => number}
 */
export function compileFormula(formula) {
  let compiled = compiledFormulas.get(formula);
  if (compiled === undefined) {
    compiled = parse(formula);
    compiledFormulas.set(formula, compiled);
  }
  return compiled;
}

/**
 * Évalue une formule tableur, ou retourne la valeur telle quelle si c'en est déjà une.
 *
 * @param formulaOrValue {string|number} Formule tableur ou valeur numérique.
 * @param pn {number} Puissance nominale en W (exposée à la formule sous `Pn`, en kW).
 * @param E {number} [Coefficient forfaitaire E]
 * @param F {number} [Coefficient forfaitaire F]
 * @returns {number}
 */
export function evaluateFormula(formulaOrValue, pn, E, F) {
  const formula =
    typeof formulaOrValue === 'string'
      ? formulaOrValue.replace(/(\d),(\d)/g, '$1.$2')
      : formulaOrValue;

  if (!isNaN(formula)) {
    return Number(formula);
  }

  const Pn = pn / 1000;
  return compileFormula(formula)({ Pn, logPn: Math.log10(Pn), E, F });
}
