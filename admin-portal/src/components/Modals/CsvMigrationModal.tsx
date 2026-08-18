import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Upload,
  Users,
} from 'lucide-react';
import { api } from '../../api/client';
import { CsvImportResult } from '../../types';

interface CsvMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvMigrationModal: React.FC<CsvMigrationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [csvText, setCsvText] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleSampleLoad = () => {
    const sample = `first_name,last_name,email,phone,gender,household_name,household_role,pan_number,date_of_birth,wedding_anniversary
Timothy,Gomez,timothy.gomez@example.com,+91 98450 77001,Male,The Gomez Family,Head,TGPMP1234T,1984-05-15,2010-06-20
Rachel,Gomez,rachel.gomez@example.com,+91 98450 77002,Female,The Gomez Family,Spouse,TGPMP1234U,1986-08-22,2010-06-20
Esther,Mathew,esther.mathew@example.com,+91 98450 88001,Female,The Mathew Family,Head,EMTPM9988E,1990-11-12,`;
    setCsvText(sample);
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      setError('Please paste or upload CSV data before importing.');
      return;
    }
    setError(null);
    setImporting(true);

    try {
      const res = await api.importMembersCsv(csvText);
      setResult(res);
      if (res.imported_members_count > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'CSV Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                ChurchCRM & Excel CSV Data Migration
              </h3>
              <p className="text-xs text-slate-500">
                Bulk import parish members, households, contact numbers, milestone dates, and PAN IDs.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {result ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>Migration Completed Successfully!</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-2xs">
                  <span className="text-slate-500 block">Members Added</span>
                  <span className="text-lg font-bold font-mono text-emerald-600">
                    {result.imported_members_count}
                  </span>
                </div>
                <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-2xs">
                  <span className="text-slate-500 block">Households Grouped</span>
                  <span className="text-lg font-bold font-mono text-indigo-600">
                    {result.imported_households_count}
                  </span>
                </div>
                <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-2xs">
                  <span className="text-slate-500 block">Skipped / Duplicates</span>
                  <span className="text-lg font-bold font-mono text-slate-600">{result.skipped_count}</span>
                </div>
              </div>
            </div>

            {result.sample_records && result.sample_records.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Sample Imported Names:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.sample_records.map((name, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File drop or paste */}
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Upload .CSV File or Paste Content Below
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSampleLoad}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Load Sample CSV
                </button>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-all">
                  <Upload className="h-3.5 w-3.5" />
                  Choose File
                  <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <textarea
              rows={8}
              placeholder="first_name,last_name,email,phone,gender,household_name,pan_number,date_of_birth..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
              <a
                href={api.getExportMembersCsvUrl()}
                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                download="ecclesia_members_template.csv"
              >
                <Download className="h-3.5 w-3.5" /> Download Full Church Member Export (.CSV)
              </a>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing || !csvText.trim()}
                  onClick={handleImport}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Upload className="h-4 w-4" />
                  {importing ? 'Processing Import...' : 'Import Records'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
