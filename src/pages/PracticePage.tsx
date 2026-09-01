import React from 'react';
import { useAutomataStore } from '../store/automataStore';
import { Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const PracticePage: React.FC = () => {
  const setActivePage = useAutomataStore(s => s.setActivePage);
  const loadPreset = useAutomataStore(s => s.loadPreset);

  const practiceChallenges = [
    {
      id: 'divisible-by-3',
      title: 'Modulo 3 Binary Divisibility',
      category: 'DFA Design',
      difficulty: 'Easy',
      description: 'Construct a minimal DFA that accepts binary strings representing numbers divisible by 3.',
      alphabet: 'Σ = {0, 1}',
      presetId: 'divisible-by-3'
    },
    {
      id: 'ends-with-01',
      title: 'Suffix Pattern Recognition: "01"',
      category: 'Pattern Matching',
      difficulty: 'Easy',
      description: 'Design a DFA that accepts strings ending with the sequence 01 over {0, 1}.',
      alphabet: 'Σ = {0, 1}',
      presetId: 'ends-with-01'
    },
    {
      id: 'even-zeros',
      title: 'Parity Counting: Even Zeros',
      category: 'Parity Languages',
      difficulty: 'Easy',
      description: 'Build an automaton that accepts all strings having an even count of the symbol 0.',
      alphabet: 'Σ = {0, 1}',
      presetId: 'even-zeros'
    },
    {
      id: 'nfa-contains-010',
      title: 'Substring Search: "010" (NFA)',
      category: 'NFA Design',
      difficulty: 'Medium',
      description: 'Construct an NFA that accepts strings containing "010" anywhere as a substring.',
      alphabet: 'Σ = {0, 1}',
      presetId: 'nfa-contains-010'
    }
  ];

  const handleOpenChallenge = (presetId?: string) => {
    if (presetId) {
      loadPreset(presetId);
    }
    setActivePage('editor');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 p-8 flex flex-col items-center transition-colors duration-200">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4" />
              <span>Interactive Challenges</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Practice Lab</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Test and sharpen your Theory of Computation problem-solving skills with interactive automata exercises.
            </p>
          </div>

          <button
            onClick={() => handleOpenChallenge()}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 font-medium text-xs text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/20 cursor-pointer"
          >
            <span>Open Blank Canvas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Practice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {practiceChallenges.map(challenge => (
            <div
              key={challenge.id}
              className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col justify-between hover:border-zinc-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 transition-all group shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" size="sm">
                    {challenge.category}
                  </Badge>
                  <Badge
                    variant={challenge.difficulty === 'Easy' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {challenge.difficulty}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                  {challenge.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  {challenge.description}
                </p>

                <div className="mt-4 inline-block font-mono text-[11px] bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 px-2.5 py-1 rounded">
                  {challenge.alphabet}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  Ready to solve
                </span>

                <button
                  onClick={() => handleOpenChallenge(challenge.presetId)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors cursor-pointer"
                >
                  <span>Load into Editor</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
