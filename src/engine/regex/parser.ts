/**
 * Regex Parser — Recursive-Descent Parser
 * 
 * Produces a RegexNode AST from a token list.
 * 
 * Grammar (precedence: lowest to highest):
 *   expr     ::= union
 *   union    ::= concat ('|' concat)*
 *   concat   ::= postfix postfix*
 *   postfix  ::= primary ('*' | '+' | '?')*
 *   primary  ::= SYMBOL | EPSILON | '(' expr ')'
 * 
 * The parser correctly handles:
 *   - Implicit concatenation
 *   - Operator precedence: * > concat > |
 *   - Parenthesized sub-expressions
 *   - +, ? normalized to core operators
 */

import { tokenize, type Token, type TokenType } from './tokenizer';
import {
  type RegexNode,
  symNode,
  epsilonNode,
  emptyNode,
  unionNode,
  concatNode,
  starNode,
  plusNode,
  optionNode,
} from './ast';

export interface ParseResult {
  success: boolean;
  node?: RegexNode;
  error?: string;
}

class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const t = this.tokens[this.pos];
    if (t.type !== 'EOF') this.pos++;
    return t;
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private eat(type: TokenType): Token {
    const t = this.peek();
    if (t.type !== type) {
      throw new Error(
        `Expected '${type}' at position ${t.position}, but got '${t.value || t.type}'`
      );
    }
    return this.advance();
  }

  // expr ::= union
  parseExpr(): RegexNode {
    return this.parseUnion();
  }

  // union ::= concat ('|' concat)*
  private parseUnion(): RegexNode {
    let left = this.parseConcat();

    while (this.check('UNION')) {
      this.advance(); // consume '|'
      
      // Allow empty right side of union: "a|" → Union(a, ε)
      if (this.check('EOF') || this.check('RPAREN')) {
        left = unionNode(left, epsilonNode());
      } else {
        const right = this.parseConcat();
        left = unionNode(left, right);
      }
    }

    return left;
  }

  // concat ::= postfix postfix*
  // A postfix exists if the next token is a primary starter (not |, ), EOF)
  private parseConcat(): RegexNode {
    const factors: RegexNode[] = [];

    while (this.isPrimaryStarter()) {
      factors.push(this.parsePostfix());
    }

    if (factors.length === 0) {
      // Empty concatenation: treat as epsilon (e.g., "()" or empty branch of union)
      return epsilonNode();
    }

    // Build left-associative concat chain
    let result = factors[0];
    for (let i = 1; i < factors.length; i++) {
      result = concatNode(result, factors[i]);
    }
    return result;
  }

  /** Is the current token the start of a primary expression? */
  private isPrimaryStarter(): boolean {
    const t = this.peek().type;
    return t === 'SYMBOL' || t === 'EPSILON' || t === 'LPAREN';
  }

  // postfix ::= primary ('*' | '+' | '?')*
  private parsePostfix(): RegexNode {
    let node = this.parsePrimary();

    // Apply zero or more postfix operators
    for (;;) {
      if (this.check('STAR')) {
        this.advance();
        node = starNode(node);
      } else if (this.check('PLUS')) {
        this.advance();
        node = plusNode(node);
      } else if (this.check('QUESTION')) {
        this.advance();
        node = optionNode(node);
      } else {
        break;
      }
    }

    return node;
  }

  // primary ::= SYMBOL | EPSILON | '(' expr ')'
  private parsePrimary(): RegexNode {
    const t = this.peek();

    if (t.type === 'SYMBOL') {
      this.advance();
      return symNode(t.value);
    }

    if (t.type === 'EPSILON') {
      this.advance();
      return epsilonNode();
    }

    if (t.type === 'LPAREN') {
      this.eat('LPAREN');

      // Handle empty parens "()" → ε
      if (this.check('RPAREN')) {
        this.eat('RPAREN');
        return epsilonNode();
      }

      const inner = this.parseExpr();

      if (!this.check('RPAREN')) {
        const tok = this.peek();
        throw new Error(
          `Expected closing ')' at position ${tok.position}, but got '${tok.value || tok.type}'. ` +
          `Did you forget to close a parenthesis?`
        );
      }
      this.eat('RPAREN');
      return inner;
    }

    // Unexpected token
    if (t.type === 'UNION') {
      throw new Error(
        `Unexpected '|' at position ${t.position}. Expected an expression before '|'.`
      );
    }
    if (t.type === 'STAR' || t.type === 'PLUS' || t.type === 'QUESTION') {
      throw new Error(
        `Unexpected '${t.value}' at position ${t.position}. ` +
        `'${t.value}' must follow an expression.`
      );
    }
    if (t.type === 'RPAREN') {
      throw new Error(
        `Unexpected ')' at position ${t.position}. No matching '('.`
      );
    }
    if (t.type === 'EOF') {
      throw new Error(`Unexpected end of expression. Expected a symbol or '('.`);
    }

    throw new Error(`Unexpected token '${t.value}' at position ${t.position}.`);
  }
}

/**
 * Parse a regular expression string into an AST.
 * Returns a ParseResult with success/failure and error details.
 */
export function parseRegex(input: string): ParseResult {
  const trimmed = input.trim();

  // Empty input = empty language (or epsilon? Convention: empty = ∅)
  if (trimmed === '' || trimmed === '∅') {
    return { success: true, node: emptyNode() };
  }
  if (trimmed === 'ε' || trimmed === 'eps' || trimmed === 'epsilon') {
    return { success: true, node: epsilonNode() };
  }

  try {
    const tokens = tokenize(trimmed);
    const parser = new Parser(tokens);
    const node = parser.parseExpr();

    // Ensure we consumed everything
    if (parser['peek']().type !== 'EOF') {
      const tok = parser['peek']();
      return {
        success: false,
        error: `Unexpected token '${tok.value}' at position ${tok.position}. ` +
               `Did you forget an operator?`
      };
    }

    return { success: true, node };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e)
    };
  }
}
