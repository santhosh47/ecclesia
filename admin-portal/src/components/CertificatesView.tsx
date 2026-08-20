import React, { useEffect, useState } from 'react';
import {
  Award,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useLocalization } from '../context/LocalizationContext';
import { CertificateTemplate, IssuedCertificate, Member } from '../types';

export const CertificatesView: React.FC = () => {
  const { config, churchProfile, hasPermission } = useLocalization();
  const [issuedCerts, setIssuedCerts] = useState<IssuedCertificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Church Registration details configured
  const defaultOrg = churchProfile || config?.organization;
  const [churchName, setChurchName] = useState<string>(defaultOrg?.name || 'ECCLESIA');
  const [churchRegNo, setChurchRegNo] = useState<string>(
    defaultOrg?.tax_id_in_80g || defaultOrg?.pan_number || defaultOrg?.us_ein || defaultOrg?.uk_charity_number || ''
  );
  const [churchAddress, setChurchAddress] = useState<string>(
    defaultOrg?.address || ''
  );

  // Sync if organization config updates
  useEffect(() => {
    if (churchProfile) {
      if (churchProfile.name) setChurchName(churchProfile.name);
      const reg = churchProfile.tax_id_in_80g || churchProfile.pan_number || churchProfile.us_ein || churchProfile.uk_charity_number || '';
      setChurchRegNo(reg);
      const addr = [churchProfile.address, churchProfile.city, churchProfile.state, churchProfile.postal_code].filter(Boolean).join(', ');
      setChurchAddress(addr || churchProfile.address || '');
    }
  }, [churchProfile]);

  // Issue Certificate Modal
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>('Baptism');
  const [recipientName, setRecipientName] = useState<string>('');
  const [secondaryName, setSecondaryName] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [officiantName, setOfficiantName] = useState<string>(defaultOrg?.senior_pastor || 'Pastor Dr. Samuel Thomas');
  const [witness1, setWitness1] = useState<string>('');
  const [witness2, setWitness2] = useState<string>('');
  const [memberId, setMemberId] = useState<number | undefined>(undefined);
  const [customRegNo, setCustomRegNo] = useState<string>('');
  const [customAddress, setCustomAddress] = useState<string>('');

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
        church_name: churchName,
        church_registration_no: customRegNo || churchRegNo || undefined,
        church_address: customAddress || churchAddress || undefined,
        member_id: memberId,
      });
      setShowIssueModal(false);
      setRecipientName('');
      setSecondaryName('');
      setWitness1('');
      setWitness2('');
      setCustomRegNo('');
      setCustomAddress('');
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

  const filteredCerts = issuedCerts.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.certificate_number.toLowerCase().includes(q) ||
      c.recipient_name.toLowerCase().includes(q) ||
      (c.secondary_name && c.secondary_name.toLowerCase().includes(q)) ||
      c.officiant_name.toLowerCase().includes(q) ||
      c.verification_code.toLowerCase().includes(q) ||
      c.certificate_type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={28} color="var(--gold-400)" />
            <span>Milestone Certificates & Dynamic PDF Engine</span>
          </h1>
          <p className="view-subtitle">
            Generate and verify official church certificates for Holy Baptism, Matrimony, Child Dedication, Confirmation, and Membership.
          </p>
        </div>
        {hasPermission('manage_certificates') && (
          <button onClick={() => setShowIssueModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            <span>Issue Official Certificate</span>
          </button>
        )}
      </div>

      {/* Church Registration Details Banner */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px 24px', borderLeft: '4px solid var(--gold-500)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(13, 19, 34, 0.6) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--gold-400)' }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-400)', fontWeight: 700 }}>
                Certificate Header & Legal Registration Details
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {churchName}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Reg / Trust No: <strong style={{ color: 'var(--text-primary)' }}>{churchRegNo || 'Not Configured'}</strong> • Address: <span style={{ color: 'var(--text-primary)' }}>{churchAddress}</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', background: 'rgba(0, 0, 0, 0.2)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            ✓ Auto-embedded into generated PDF certificates
          </div>
        </div>
      </div>

      {/* Verification Tool & Templates Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Verification Widget */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={18} color="var(--gold-400)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Certificate Verification Tool
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Verify authenticity and security serials of church milestone certificates.
            </p>

            <form onSubmit={handleVerify} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                placeholder="e.g. ECCL-BAP-7788"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="form-input"
                style={{ fontSize: '12.5px', fontFamily: 'monospace', textTransform: 'uppercase' }}
              />
              <button type="submit" disabled={verifyLoading} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                {verifyLoading ? 'Checking...' : 'Verify'}
              </button>
            </form>

            {verificationResult && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  background: verificationResult.valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${verificationResult.valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  color: verificationResult.valid ? '#34d399' : '#f87171',
                }}
              >
                {verificationResult.valid ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                      <CheckCircle2 size={15} />
                      <span>AUTHENTIC & VERIFIED</span>
                    </div>
                    <div>Recipient: <strong>{verificationResult.recipient}</strong></div>
                    <div>Type: {verificationResult.type} • Event: {verificationResult.event_date}</div>
                    <div>Officiant: {verificationResult.officiant}</div>
                  </div>
                ) : (
                  <div>⚠️ Invalid or unregistered certificate code.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Templates List */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCheck size={16} color="var(--gold-400)" />
              <span>Configured Templates ({templates.length})</span>
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--gold-400)', fontWeight: 600 }}>
              Gold Parchment Format
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {tmpl.title}
                  </span>
                  <span className="status-pill badge-neutral" style={{ fontSize: '10px' }}>
                    {tmpl.type}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                  "{tmpl.scripture_verse ? tmpl.scripture_verse.slice(0, 75) + '...' : 'Sacred Ordinance'}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Issued Certificates Table Section */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Issued Official Certificates ({issuedCerts.length})
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Historical register of issued sacramental certificates with PDF download and verification codes.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ width: '260px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
            >
              <option value="">All Milestone Types</option>
              <option value="Baptism">Holy Baptism</option>
              <option value="Wedding">Holy Matrimony</option>
              <option value="Child Dedication">Child Dedication</option>
              <option value="Confirmation">Holy Confirmation</option>
              <option value="Membership">Church Membership</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cert Serial #</th>
                <th>Type</th>
                <th>Recipient / Spouse</th>
                <th>Event Date</th>
                <th>Officiating Pastor</th>
                <th>Verification Code</th>
                <th style={{ textAlign: 'right' }}>PDF Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading certificate register...
                  </td>
                </tr>
              ) : filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No certificates found.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id}>
                    <td>
                      <span className="cell-mono" style={{ color: 'var(--gold-400)', fontWeight: 700 }}>
                        {cert.certificate_number}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill badge-amber">
                        {cert.certificate_type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {cert.recipient_name}
                        {cert.secondary_name && (
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '12px' }}>
                            {' '} & {cert.secondary_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{cert.event_date}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>{cert.officiant_name}</span>
                    </td>
                    <td>
                      <span className="cell-mono" style={{ color: '#60a5fa', fontWeight: 600 }}>
                        {cert.verification_code}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a
                        href={api.getCertificatePdfUrl(cert.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download size={13} />
                        <span>Download PDF</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Issue Official Certificate */}
      {showIssueModal && (
        <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
          <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} color="var(--gold-400)" />
                  <span>Issue Life Milestone Certificate</span>
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Generates an official verifiable certificate with church legal registration details and custom serial.
                </p>
              </div>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowIssueModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIssueCertificate}>
              <div className="modal-content">
                <div className="form-grid" style={{ marginBottom: '16px' }}>
                  <div>
                    <label className="form-label">Certificate Type *</label>
                    <select
                      required
                      className="form-select"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      <option value="Baptism">Holy Baptism</option>
                      <option value="Wedding">Holy Matrimony / Wedding</option>
                      <option value="Child Dedication">Child Dedication</option>
                      <option value="Confirmation">Holy Confirmation</option>
                      <option value="Membership">Church Membership</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Link Member (Optional)</label>
                    <select
                      className="form-select"
                      value={memberId || ''}
                      onChange={(e) => {
                        const mId = e.target.value ? Number(e.target.value) : undefined;
                        setMemberId(mId);
                        if (mId) {
                          const m = members.find((x) => x.id === mId);
                          if (m) {
                            setRecipientName(`${m.first_name} ${m.last_name}`);
                          }
                        }
                      }}
                    >
                      <option value="">Select from Member Directory</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.first_name} {m.last_name} ({m.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={selectedType === 'Wedding' ? '' : 'form-group-full'}>
                    <label className="form-label">Recipient Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g., Chloe Anderson"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>

                  {selectedType === 'Wedding' && (
                    <div>
                      <label className="form-label">Spouse Full Name *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g., Elena Morales"
                        value={secondaryName}
                        onChange={(e) => setSecondaryName(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="form-label">Sacrament / Event Date *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Officiating Minister / Pastor *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={officiantName}
                      onChange={(e) => setOfficiantName(e.target.value)}
                      placeholder="e.g. Pastor Dr. Samuel Thomas"
                    />
                  </div>

                  <div>
                    <label className="form-label">Witness / Sponsor 1</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Elder David Sterling"
                      value={witness1}
                      onChange={(e) => setWitness1(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Witness / Sponsor 2</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Dr. Marcus Anderson"
                      value={witness2}
                      onChange={(e) => setWitness2(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px', padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold-400)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Church Legal Registration On Certificate (Editable Override)
                  </div>
                  <div className="form-grid">
                    <div>
                      <label className="form-label">Church Name Header</label>
                      <input
                        type="text"
                        className="form-input"
                        value={churchName}
                        onChange={(e) => setChurchName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">Legal Reg / 80G / 501(c)(3) / Charity No</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={churchRegNo}
                        value={customRegNo || churchRegNo}
                        onChange={(e) => {
                          setCustomRegNo(e.target.value);
                          setChurchRegNo(e.target.value);
                        }}
                      />
                    </div>
                    <div className="form-group-full">
                      <label className="form-label">Church Physical Address</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={churchAddress}
                        value={customAddress || churchAddress}
                        onChange={(e) => {
                          setCustomAddress(e.target.value);
                          setChurchAddress(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Award size={16} />
                  <span>Generate & Issue Certificate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
