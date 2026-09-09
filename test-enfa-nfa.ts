import { parseRegex } from './src/engine/regex/parser';
import { regexToENFA } from './src/engine/conversions/regexToENFA';
import { enfaToNFA } from './src/engine/conversions/enfaToNFA';
import type { FormalAutomaton } from './src/engine/types/conversion';

const p = parseRegex('(a|b)*abb');
const enfa = regexToENFA(p.node!).result as FormalAutomaton;
console.log('ε-NFA states:', enfa.states.size);

const nfaRes = enfaToNFA(enfa);
const nfa = nfaRes.result as FormalAutomaton;
console.log('Raw NFA states after ε-elimination:', nfa.states.size);