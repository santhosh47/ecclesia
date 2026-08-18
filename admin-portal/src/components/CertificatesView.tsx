import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  FileText,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { CertificateTemplate, IssuedCertificate, Member } from '../types';

export const CertificatesView: React.FC = () => {
  const [issuedCerts, setIssuedCerts] = useState<IssuedCertificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('');

  // Issue Certificate Modal
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>('Baptism');
  const [recipientName, setRecipientName] = useState<string>('');
  const [secondaryName, setSecondaryName] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [officiantName, setOfficiantName] = useState<string>('Rev. Dr. Samuel Thomas');
  const [witness1, setWitness1] = useState<string>('');
  const [witness2, setWitness2] = useState<string>('');
  const [memberId, setMemberId] = useState<number | undefined>(undefined);

  // Verification Tool State
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [certs, tmpls, mems] = await Promise.all([
        api.getIssuedCertificates(filterType || undefined),
        api.getCertificateTemplates(),
        api.getMembers(),
      ]);
      setIssuedCerts(certs);
      setTemplates(tmpls);
      setMembers(mems);
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType]);

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.issueCertificate({
        certificate_type: selectedType,
        recipient_name: recipientName,
        secondary_name: secondaryName || undefined,
        event_date: eventDate,
        officiant_name: officiantName,
        witness_1: witness1 || undefined,
        witness_2: witness2 || undefined,
        member_id: memberId,
      });
      setShowIssueModal(false);
      setRecipientName('');
      setSecondaryName('');
      setWitness1('');
      setWitness2('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to issue certificate');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    try {
      setVerifyLoading(true);
      const res = await api.verifyCertificate(verifyCode.trim());
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationResult({ valid: false, message: err.message });
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 p-6 rounded-2xl backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Award className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            Milestone Certificates & Dynamic PDF Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dynamic PDF generation for Holy Baptism, Matrimony, Child Dedication, Confirmation, and Membership.
          </p>
        </div>
        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          Issue Official Certificate
        </button>
      </div>

      {/* Verification & Templates Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Widget */}
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Certificate Verification Tool</h3>
          </div>
          <p className="text-xs text-slate-500">
            Verify authenticity of church milestone certificates via verification code or QR code.
          </p>
          <form onSubmit={handleVerify} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., ECCL-BAP-7788"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
              />
              <button
                type="submit"
                disabled={verifyLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
              >
                Verify
              </button>
            </div>
          </form>

          {verificationResult && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                verificationResult.valid
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'
              }`}
            >
              {verificationResult.valid ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>AUTHENTIC & VERIFIED</span>
                  </div>
                  <p>Recipient: {verificationResult.recipient}</p>
                  <p>Type: {verificationResult.type}</p>
                  <p>Event Date: {verificationResult.event_date}</p>
                  <p>Officiant: {verificationResult.officiant}</p>
                </div>
              ) : (
                <p>Invalid or unregistered verification code.</p>
              )}
            </div>
          )}
        </div>

        {/* Templates List */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
            <span>Configured Certificate Templates ({templates.length})</span>
            <span className="text-xs font-normal text-slate-500">Gold Ornate Borders & Scripture Text</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-xl space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-amber-900 dark:text-amber-200">{tmpl.title}</span>
                  <span className="px-1.5 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded text-[10px] font-semibold uppercase">
                    {tmpl.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2">
                  "{tmpl.scripture_verse}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Issued Certificates Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Issued Official Certificates ({issuedCerts.length})
          </h3>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">All Milestone Types</option>
              <option value="Baptism">Holy Baptism</option>
              <option value="Wedding">Holy Matrimony / Wedding</option>
              <option value="Child Dedication">Child Dedication</option>
              <option value="Confirmation">Holy Confirmation</option>
              <option value="Membership">Church Membership</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800/80">
              <tr>
                <th className="px-5 py-3.5">Cert #</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Recipient</th>
                <th className="px-5 py-3.5">Event Date</th>
                <th className="px-5 py-3.5">Officiant</th>
                <th className="px-5 py-3.5">Verification Code</th>
                <th className="px-5 py-3.5 text-right">PDF Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {issuedCerts.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                    {cert.certificate_number}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {cert.certificate_type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                    {cert.recipient_name}
                    {cert.secondary_name && <span className="text-slate-400 text-xs"> & {cert.secondary_name}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 text-xs">{cert.event_date}</td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 text-xs">{cert.officiant_name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    {cert.verification_code}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <a
                      href={api.getCertificatePdfUrl(cert.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Issue Certificate */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                Issue Life Milestone Certificate
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Certificate Type *
                </label>
                <select
                  required
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Baptism">Holy Baptism</option>
                  <option value="Wedding">Holy Matrimony / Wedding</option>
                  <option value="Child Dedication">Child Dedication</option>
                  <option value="Confirmation">Holy Confirmation</option>
                  <option value="Membership">Church Membership</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Chloe Anderson"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {selectedType === 'Wedding' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Spouse / Secondary Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Elena Morales"
                    value={secondaryName}
                    onChange={(e) => setSecondaryName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sacrament / Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Officiating Minister *
                  </label>
                  <input
                    type="text"
                    required
                    value={officiantName}
                    onChange={(e) => setOfficiantName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Witness / Sponsor 1
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Elder David Sterling"
                    value={witness1}
                    onChange={(e) => setWitness1(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Witness / Sponsor 2
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dr. Marcus Anderson"
                    value={witness2}
                    onChange={(e) => setWitness2(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm"
                >
                  Generate & Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
