import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { useAutomataStore } from '../../store/automataStore';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const importJSON = useAutomataStore(s => s.importJSON);

  const [jsonText, setJsonText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    setErrorMsg(null);
    if (!jsonText.trim()) {
      setErrorMsg('Please paste JSON or upload a file.');
      return;
    }

    const result = importJSON(jsonText);
    if (result.success) {
      setJsonText('');
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to import JSON.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setJsonText(content);
        setErrorMsg(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file.');
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Automaton"
      subtitle="Import an automaton model from a JSON file or pasted JSON text."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Upload File Zone */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 p-4 text-xs font-medium text-zinc-400 hover:border-violet-500 hover:text-violet-300 hover:bg-violet-950/10 transition-colors"
          >
            <Upload className="w-4 h-4 text-violet-400" />
            <span>Click to select a JSON file from your computer</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Or Paste Raw JSON</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        {/* JSON Textarea */}
        <div>
          <textarea
            rows={8}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`{\n  "type": "DFA",\n  "states": [\n    { "id": "q0", "name": "q0", "isStart": true },\n    { "id": "q1", "name": "q1", "isAccepting": true }\n  ],\n  "transitions": [\n    { "from": "q0", "to": "q1", "symbols": ["0"] }\n  ]\n}`}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 placeholder-zinc-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleImport}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 shadow-lg shadow-violet-600/30 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Import Automaton</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
