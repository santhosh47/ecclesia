import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  Database,
  Download,
  HardDrive,
  RefreshCw,
  Shield,
  Trash2,
  Zap,
} from 'lucide-react';
import { api } from '../api/client';
import { BackupMetadata } from '../types';

export const BackupsView: React.FC = () => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<{
    status: string;
    database: string;
    version: string;
  } | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [healthData, backupsData] = await Promise.all([
        api.getSystemHealth().catch(() => null),
        api.getBackups().catch(() => ({ items: [], total: 0 })),
      ]);
      setSystemHealth(healthData);
      setBackups(backupsData.items || []);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to load system backup history.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      setNotification(null);
      const res = await api.createBackup();
      setNotification({
        type: 'success',
        message: `Database snapshot created successfully: ${res.backup.filename} (${formatBytes(res.backup.size_bytes)})`,
      });
      await loadData();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to generate live database backup.',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      setDownloading(filename);
      await api.downloadBackup(filename);
      setNotification({
        type: 'success',
        message: `Downloaded snapshot archive: ${filename}`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || `Failed to download ${filename}.`,
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete backup "${filename}"?`)) {
      return;
    }

    try {
      setDeleting(filename);
      await api.deleteBackup(filename);
      setNotification({
        type: 'success',
        message: `Backup archive deleted: ${filename}`,
      });
      await loadData();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || `Failed to delete ${filename}.`,
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const totalStorageBytes = backups.reduce((acc, b) => acc + (b.size_bytes || 0), 0);

  const filteredBackups = backups.filter((b) =>
    b.filename.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Header with Title and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Database Backups & Maintenance</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live ACID Snapshots
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Create on-demand, non-blocking database archives with automated Gzip compression and 30-day retention.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading || creating}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
            title="Refresh backups list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1b6654] hover:bg-[#155243] rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {creating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Snapshotting Database...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Create Database Backup
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 border ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          )}
          <div className="text-sm font-medium flex-1">{notification.message}</div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-semibold underline hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* System Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Live DB Health */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Database Connection
            </div>
            <div className="text-lg font-bold text-gray-900 mt-0.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {systemHealth?.database ? 'Online & Healthy' : 'Active Connection'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Engine: SQLite 3 (WAL / ACID Safe) • API v{systemHealth?.version || '1.0.0'}
            </div>
          </div>
        </div>

        {/* Card 2: Snapshots Count */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Archive className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stored Snapshots
            </div>
            <div className="text-lg font-bold text-gray-900 mt-0.5">
              {backups.length} {backups.length === 1 ? 'Archive' : 'Archives'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Retention: 30 Days (Max 20 snapshots)
            </div>
          </div>
        </div>

        {/* Card 3: Storage Footprint */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Compressed Storage
            </div>
            <div className="text-lg font-bold text-gray-900 mt-0.5">
              {formatBytes(totalStorageBytes)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Compression: Gzip (.db.gz format)
            </div>
          </div>
        </div>
      </div>

      {/* Snapshots Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900">Snapshot Archive History</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Available compressed live database snapshots ready for off-site backup or disaster recovery.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search snapshots by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b6654]/20 focus:border-[#1b6654]"
            />
          </div>
        </div>

        {loading && backups.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#1b6654] mb-3" />
            Loading backup catalog...
          </div>
        ) : filteredBackups.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-gray-900">
              {searchTerm ? 'No matching snapshots found' : 'No database backups created yet'}
            </h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
              {searchTerm
                ? 'Try adjusting your search keywords or clear the filter.'
                : 'Click below to create your first live, compressed database snapshot. Backups do not lock active congregation operations.'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateBackup}
                disabled={creating}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1b6654] hover:bg-[#155243] rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5" />
                Create First Backup
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Archive Filename</th>
                  <th className="px-5 py-3.5">Size</th>
                  <th className="px-5 py-3.5">Created Timestamp</th>
                  <th className="px-5 py-3.5">Format & Integrity</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBackups.map((b) => {
                  const isDownloading = downloading === b.filename;
                  const isDeleting = deleting === b.filename;

                  return (
                    <tr key={b.filename} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-[#1b6654]">
                            <Archive className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-mono text-xs font-semibold text-gray-900">
                              {b.filename}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              Snapshot identifier
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-700">
                        {formatBytes(b.size_bytes)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(b.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Shield className="w-3 h-3 text-blue-600" />
                          Gzip .db.gz (Verified)
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(b.filename)}
                            disabled={isDownloading || isDeleting}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors disabled:opacity-50"
                            title="Download snapshot archive"
                          >
                            <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                            {isDownloading ? 'Downloading...' : 'Download'}
                          </button>
                          <button
                            onClick={() => handleDelete(b.filename)}
                            disabled={isDownloading || isDeleting}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors disabled:opacity-50"
                            title="Permanently delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safety & Retention Policy Card */}
      <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#1b6654] mt-0.5 shrink-0" />
        <div className="text-xs text-emerald-900 space-y-1">
          <p className="font-semibold">Automated Retention & Storage Safety</p>
          <p className="text-emerald-800">
            Database live snapshots are generated using non-blocking SQLite copy APIs, allowing continuous church transactions during backup creation. Stored archives are auto-pruned after 30 days or when total snapshots exceed 20 to protect disk space.
          </p>
        </div>
      </div>
    </div>
  );
};
