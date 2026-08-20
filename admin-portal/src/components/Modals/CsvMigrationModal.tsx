import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Upload,
  Users,
  X,
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet size={22} color="var(--gold-400)" />
            <div>
              <h3 className="modal-title">ChurchCRM & Excel CSV Data Migration</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Bulk import parish members, households, contact numbers, milestone dates, and PAN IDs.
              </p>
            </div>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-content">
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#f87171',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10b981',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '14.5px' }}>
                  <CheckCircle2 size={18} />
                  <span>Migration Completed Successfully!</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                  <div style={{ padding: '10px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Members Added</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#34d399' }}>
                      {result.imported_members_count}
                    </span>
                  </div>
                  <div style={{ padding: '10px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Households Grouped</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--gold-400)' }}>
                      {result.imported_households_count}
                    </span>
                  </div>
                  <div style={{ padding: '10px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Skipped / Duplicates</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{result.skipped_count}</span>
                  </div>
                </div>
              </div>

              {result.sample_records && result.sample_records.length > 0 && (
                <div>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Sample Imported Records:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {result.sample_records.map((name, i) => (
                      <span
                        key={i}
                        className="status-pill badge-neutral"
                        style={{ fontSize: '12px' }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Upload .CSV File or Paste Content Below:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleSampleLoad}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '12px' }}
                  >
                    Load Sample CSV
                  </button>
                  <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={13} />
                    <span>Choose File</span>
                    <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <textarea
                rows={8}
                placeholder="first_name,last_name,email,phone,gender,household_name,pan_number,date_of_birth..."
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.5, resize: 'vertical' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <a
                  href={api.getExportMembersCsvUrl()}
                  style={{ fontSize: '12.5px', color: 'var(--gold-400)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                  download="ecclesia_members_template.csv"
                >
                  <Download size={14} />
                  <span>Download Full Church Member Export (.CSV)</span>
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {result ? (
            <button
              onClick={onClose}
              className="btn btn-primary"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing || !csvText.trim()}
                onClick={handleImport}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Upload size={14} />
                <span>{importing ? 'Processing Import...' : 'Import Records'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
