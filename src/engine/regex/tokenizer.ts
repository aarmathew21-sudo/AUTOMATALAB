/**
 * Regex Tokenizer
 * 
 * Converts a raw regex string into a flat token list.
 * Handles multi-character epsilon representations: 'ε', 'eps', 'epsilon'.
 */

export type TokenType =
  | 'SYMBOL'     // a, b, 0, 1, etc.
  | 'EPSILON'    // ε
  | 'UNION'      // |
  | 'STAR'       // *
  | 'PLUS'       // +
  | 'QUESTION'   // ?
  | 'LPAREN'     // (
  | 'RPAREN'     // )
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

/**
 * Tokenizes a regular expression string.
 * Throws a descriptive error for unexpected characters.
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Skip whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i++;
      continue;
    }

    // Epsilon: ε, eps, epsilon
    if (ch === 'ε') {
      tokens.push({ type: 'EPSILON', value: 'ε', position: i });
      i++;
      continue;
    }
    if (input.startsWith('epsilon', i)) {
      tokens.push({ type: 'EPSILON', value: 'ε', position: i });
      i += 7;
      continue;
    }
    if (input.startsWith('eps', i)) {
      tokens.push({ type: 'EPSILON', value: 'ε', position: i });
      i += 3;
      continue;
    }

    switch (ch) {
      case '|':
        tokens.push({ type: 'UNION', value: '|', position: i });
        i++;
        break;
      case '*':
        tokens.push({ type: 'STAR', value: '*', position: i });
        i++;
        break;
      case '+':
        tokens.push({ type: 'PLUS', value: '+', position: i });
        i++;
        break;
      case '?':
        tokens.push({ type: 'QUESTION', value: '?', position: i });
        i++;
        break;
      case '(':
        tokens.push({ type: 'LPAREN', value: '(', position: i });
        i++;
        break;
      case ')':
        tokens.push({ type: 'RPAREN', value: ')', position: i });
        i++;
        break;
      default: {
        // Any printable character is a valid symbol
        if (ch >= ' ') {
          tokens.push({ type: 'SYMBOL', value: ch, position: i });
          i++;
        } else {
          throw new Error(
            `Unexpected character '${ch}' at position ${i} in regex: "${input}"`
          );
        }
      }
    }
  }

  tokens.push({ type: 'EOF', value: '', position: i });
  return tokens;
}
