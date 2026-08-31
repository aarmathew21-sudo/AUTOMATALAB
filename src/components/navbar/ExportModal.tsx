import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useAutomataStore } from '../../store/automataStore';
import { exportAutomatonToJSON } from '../../engine/serializer';
import { Copy, Check, Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const states = useAutomataStore(s => s.states);
  const transitions = useAutomataStore(s => s.transitions);
  const automatonType = useAutomataStore(s => s.automatonType);
  const startStateId = useAutomataStore(s => s.startStateId);
  const acceptingStateIds = useAutomataStore(s => s.acceptingStateIds);
  const showToast = useAutomataStore(s => s.showToast);

  const [copied, setCopied] = useState(false);

  const jsonString = useMemo(() => {
    if (!isOpen) return '';
    return exportAutomatonToJSON(states, transitions, automatonType, startStateId, acceptingStateIds);
  }, [isOpen, states, transitions, automatonType, startStateId, acceptingStateIds]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      showToast('JSON copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `automaton_${automatonType.toLowerCase()}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Automaton JSON downloaded', 'success');
    } catch {
      showToast('Failed to download file', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Automaton"
      subtitle="Export the current formal automaton specification in standard JSON format."
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="relative">
          <pre className="max-h-72 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-violet-300 select-all">
            {jsonString}
          </pre>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 shadow-lg shadow-violet-600/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download .json</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
