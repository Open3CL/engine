/**
 * Parse un JSON dont les objets peuvent contenir des clés dupliquées.
 *
 * L'API ADEME (api-externe.ademe.fr/api/v1/pub/dpe) sérialise les collections XML en répétant
 * la clé : `"baie_vitree_collection": { "baie_vitree": {...}, "baie_vitree": {...} }`.
 * `JSON.parse` ne conserve que la dernière occurrence, ce qui réduit chaque collection à un seul
 * élément. Ici, les valeurs d'une clé répétée sont regroupées dans un tableau, dans l'ordre.
 *
 * @param text {string}
 * @return {any}
 */
export function parseJsonWithDuplicateKeys(text) {
  let pos = 0;

  const fail = (message) => {
    throw new SyntaxError(`${message} at position ${pos}`);
  };

  const skipWhitespace = () => {
    while (pos < text.length) {
      const c = text.charCodeAt(pos);
      // espace, \t, \n, \r
      if (c === 32 || c === 9 || c === 10 || c === 13) pos++;
      else break;
    }
  };

  const parseString = () => {
    const start = pos;
    pos++; // guillemet ouvrant
    let hasEscape = false;
    while (pos < text.length) {
      const c = text.charCodeAt(pos);
      if (c === 34) break; // "
      if (c === 92) {
        // \
        hasEscape = true;
        pos += 2;
      } else {
        pos++;
      }
    }
    if (pos >= text.length) fail('Unterminated string');
    pos++; // guillemet fermant
    return hasEscape ? JSON.parse(text.slice(start, pos)) : text.slice(start + 1, pos - 1);
  };

  const parseNumber = () => {
    const match = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
    match.lastIndex = pos;
    const result = match.exec(text);
    if (!result) fail('Unexpected token');
    pos += result[0].length;
    return Number(result[0]);
  };

  const parseLiteral = (literal, value) => {
    if (!text.startsWith(literal, pos)) fail('Unexpected token');
    pos += literal.length;
    return value;
  };

  const parseObject = () => {
    pos++; // {
    const obj = {};
    /** Clés dont la valeur est un tableau créé à partir de doublons (≠ tableau JSON d'origine) */
    const duplicatedKeys = new Set();
    skipWhitespace();
    if (text[pos] === '}') {
      pos++;
      return obj;
    }
    while (true) {
      skipWhitespace();
      if (text[pos] !== '"') fail('Expected property name');
      const key = parseString();
      skipWhitespace();
      if (text[pos] !== ':') fail("Expected ':'");
      pos++;
      const value = parseValue();

      if (!Object.hasOwn(obj, key)) {
        obj[key] = value;
      } else if (duplicatedKeys.has(key)) {
        obj[key].push(value);
      } else {
        obj[key] = [obj[key], value];
        duplicatedKeys.add(key);
      }

      skipWhitespace();
      if (text[pos] === ',') {
        pos++;
      } else if (text[pos] === '}') {
        pos++;
        return obj;
      } else {
        fail("Expected ',' or '}'");
      }
    }
  };

  const parseArray = () => {
    pos++; // [
    const arr = [];
    skipWhitespace();
    if (text[pos] === ']') {
      pos++;
      return arr;
    }
    while (true) {
      arr.push(parseValue());
      skipWhitespace();
      if (text[pos] === ',') {
        pos++;
      } else if (text[pos] === ']') {
        pos++;
        return arr;
      } else {
        fail("Expected ',' or ']'");
      }
    }
  };

  function parseValue() {
    skipWhitespace();
    switch (text[pos]) {
      case '{':
        return parseObject();
      case '[':
        return parseArray();
      case '"':
        return parseString();
      case 't':
        return parseLiteral('true', true);
      case 'f':
        return parseLiteral('false', false);
      case 'n':
        return parseLiteral('null', null);
      default:
        return parseNumber();
    }
  }

  const result = parseValue();
  skipWhitespace();
  if (pos < text.length) fail('Unexpected data after JSON');
  return result;
}
