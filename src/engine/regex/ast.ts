/**
 * Regex AST — Abstract Syntax Tree node types for regular expressions.
 * 
 * Precedence (lowest to highest):
 *   Union < Concatenation < Star/Plus/Option
 * 
 * `+` and `?` are normalized during construction:
 *   A+ → Concat(A, Star(A))
 *   A? → Union(A, Epsilon)
 */

export type RegexNode =
  | SymbolNode
  | EpsilonNode
  | EmptyNode
  | UnionNode
  | ConcatNode
  | StarNode;

export interface SymbolNode {
  type: 'Symbol';
  value: string;
}

/** Matches the empty string ε */
export interface EpsilonNode {
  type: 'Epsilon';
}

/** Matches nothing (empty language ∅) */
export interface EmptyNode {
  type: 'Empty';
}

export interface UnionNode {
  type: 'Union';
  left: RegexNode;
  right: RegexNode;
}

export interface ConcatNode {
  type: 'Concat';
  left: RegexNode;
  right: RegexNode;
}

export interface StarNode {
  type: 'Star';
  child: RegexNode;
}

// ─── Constructors ────────────────────────────────────────────────────────────

export function symNode(value: string): SymbolNode {
  return { type: 'Symbol', value };
}

export function epsilonNode(): EpsilonNode {
  return { type: 'Epsilon' };
}

export function emptyNode(): EmptyNode {
  return { type: 'Empty' };
}

export function unionNode(left: RegexNode, right: RegexNode): RegexNode {
  // Simplifications: ∅|A = A, A|∅ = A
  if (left.type === 'Empty') return right;
  if (right.type === 'Empty') return left;
  return { type: 'Union', left, right };
}

export function concatNode(left: RegexNode, right: RegexNode): RegexNode {
  // Simplifications: ∅·A = ∅, A·∅ = ∅, ε·A = A, A·ε = A
  if (left.type === 'Empty' || right.type === 'Empty') return emptyNode();
  if (left.type === 'Epsilon') return right;
  if (right.type === 'Epsilon') return left;
  return { type: 'Concat', left, right };
}

export function starNode(child: RegexNode): RegexNode {
  // ε* = ε, ∅* = ε
  if (child.type === 'Epsilon') return epsilonNode();
  if (child.type === 'Empty') return epsilonNode();
  // (A*)* = A*
  if (child.type === 'Star') return child;
  return { type: 'Star', child };
}

/** Normalize A+ → Concat(A, Star(A)) */
export function plusNode(child: RegexNode): RegexNode {
  return concatNode(child, starNode(child));
}

/** Normalize A? → Union(A, Epsilon) */
export function optionNode(child: RegexNode): RegexNode {
  return unionNode(child, epsilonNode());
}

// ─── Serialization ───────────────────────────────────────────────────────────

type Precedence = 0 | 1 | 2; // 0=union, 1=concat, 2=star

function precedenceOf(node: RegexNode): Precedence {
  if (node.type === 'Union') return 0;
  if (node.type === 'Concat') return 1;
  return 2;
}

/**
 * Converts a RegexNode AST back to a minimal, correctly parenthesized regex string.
 * Uses precedence rules to add parentheses only where necessary.
 */
export function toRegexString(node: RegexNode): string {
  return toStr(node, -1 as Precedence);
}

function toStr(node: RegexNode, parentPrec: Precedence | -1): string {
  switch (node.type) {
    case 'Symbol':
      return node.value;
    case 'Epsilon':
      return 'ε';
    case 'Empty':
      return '∅';
    case 'Star': {
      const inner = toStr(node.child, 2);
      // Add parens if child has lower precedence than Star
      const needParens = precedenceOf(node.child) < 2;
      return needParens ? `(${inner})*` : `${inner}*`;
    }
    case 'Concat': {
      const left = toStr(node.left, 1);
      const right = toStr(node.right, 1);
      // Right side needs parens if it's a Union at this level
      const rightStr = node.right.type === 'Union' ? `(${toStr(node.right, -1 as Precedence)})` : right;
      // Left side needs parens if it's a Union at this level
      const leftStr = node.left.type === 'Union' ? `(${toStr(node.left, -1 as Precedence)})` : left;
      const result = `${leftStr}${rightStr}`;
      // Wrap in parens if parent precedence is higher than concat
      if (parentPrec > precedenceOf(node)) return `(${result})`;
      return result;
    }
    case 'Union': {
      const left = toStr(node.left, 0);
      const right = toStr(node.right, 0);
      const result = `${left}|${right}`;
      // Wrap in parens if parent has higher precedence than union
      if (parentPrec > precedenceOf(node)) return `(${result})`;
      return result;
    }
  }
}

/**
 * Deep equality check for two RegexNode ASTs.
 */
export function regexNodesEqual(a: RegexNode, b: RegexNode): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'Symbol': return (b as SymbolNode).value === a.value;
    case 'Epsilon': return true;
    case 'Empty': return true;
    case 'Star': return regexNodesEqual(a.child, (b as StarNode).child);
    case 'Union': {
      const bU = b as UnionNode;
      return regexNodesEqual(a.left, bU.left) && regexNodesEqual(a.right, bU.right);
    }
    case 'Concat': {
      const bC = b as ConcatNode;
      return regexNodesEqual(a.left, bC.left) && regexNodesEqual(a.right, bC.right);
    }
  }
}
