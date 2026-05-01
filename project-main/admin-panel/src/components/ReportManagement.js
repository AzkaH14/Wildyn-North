import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../config/api';
import { analyzeContent } from '../utils/contentAnalyzer';

const styles = `
  .report-management {
    padding: 16px 20px;
    max-width: 860px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #16231b;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid #dbe7df;
  }

  .section-header h2 {
    font-size: 17px;
    font-weight: 600;
    color: #16231b;
    margin: 0;
  }

  .refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #1a5f3a;
    background: #edf5f0;
    border: 1px solid #cfe2d5;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .refresh-btn:hover { background: #e1efe7; }

  .filter-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 14px;
    background: #f1f7f3;
    padding: 4px;
    border-radius: 8px;
    width: fit-content;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: 5px 13px;
    font-size: 12px;
    font-weight: 500;
    color: #5d7066;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .filter-btn:hover { color: #1f3829; background: #e5f1ea; }

  .filter-btn.active {
    color: #16231b;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.10);
    font-weight: 600;
  }

  .error-message {
    background: #fff0f0;
    color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 9px 13px;
    font-size: 13px;
    margin-bottom: 12px;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #9ca3af;
    font-size: 13px;
    background: #f9fafb;
    border-radius: 10px;
    border: 1px dashed #e5e7eb;
  }

  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #9ca3af;
    font-size: 13px;
  }

  .reports-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .report-card {
    background: #ffffff;
    border: 1px solid #dbe7df;
    border-radius: 10px;
    padding: 13px 15px;
    transition: box-shadow 0.15s ease;
  }

  .report-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.06); }

  .report-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .report-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
  }

  .report-badges {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
  }

  .report-image-container {
    margin-bottom: 10px;
    border-radius: 6px;
    overflow: hidden;
    background: #f3f4f6;
    width: 180px;
    height: 130px;
    flex-shrink: 0;
  }

  .report-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    border-radius: 6px;
  }

  /* ── FIXED: info grid ── */
  .report-info {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px 16px;
    margin-bottom: 10px;
    padding: 8px 12px;
    background: #f3f8f5;
    border-radius: 7px;
    border: 1px solid #e3eee8;
    min-height: 130px;        /* matches image height, expands if more fields present */
    box-sizing: border-box;
    align-content: start;
  }

  .info-row {
    font-size: 12px;
    color: #374151;
    line-height: 1.3;
    min-width: 0;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  .info-row strong {
    color: #6f8479;
    font-weight: 500;
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 1px;
    white-space: nowrap;
  }

  .card-body {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .report-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 10px;
    border-top: 1px solid #e7f0eb;
  }

  .btn-delete {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 500;
    color: #b91c1c;
    background: #fff5f5;
    border: 1px solid #fecaca;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-delete:hover { background: #fee2e2; border-color: #f87171; }
  .btn-delete:active { transform: scale(0.98); }

  @media (max-width: 600px) {
    .report-info { grid-template-columns: 1fr 1fr; }
    .filter-tabs { width: 100%; }
    .section-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  }
`;

const TAB_CONFIG = [
  { key: 'all',          label: 'All'          },
  { key: 'verified',     label: 'Verified'     },
  { key: 'unverified',   label: 'Unverified'   },
  { key: 'under_review', label: 'Under Review' },
];

const ReportManagement = ({ admin }) => {
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('all');
  const [allReports, setAllReports] = useState([]);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ADMIN_ENDPOINTS.allReports);
      let reportsData = response.data.reports || [];

      const analysed = await Promise.all(
        reportsData.map(async (r) => {
          const result = await analyzeContent(r.specieName || '');
          return { ...r, analysis: result };
        })
      );

      setAllReports(analysed);

      let filtered = analysed;
      if (filter === 'verified')     filtered = analysed.filter((r) => r.researcherStatus === 'verified');
      else if (filter === 'unverified')   filtered = analysed.filter((r) => r.researcherStatus !== 'verified');
      else if (filter === 'under_review') filtered = analysed.filter((r) => r.researcherStatus === 'under_review');

      setReports(filtered);
      setError('');
    } catch (err) {
      setError('Failed to load reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.'))
      return;
    try {
      await axios.delete(ADMIN_ENDPOINTS.deleteReport(reportId), {
        data: { adminUsername: admin.username },
      });
      alert('Report removed successfully');
      fetchReports();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Unable to remove content at this time.';
      alert(errorMessage);
      console.error('Error deleting report:', err);
    }
  };

  const normalizeImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('data:image')) return imageUrl;
    const API_BASE = ADMIN_ENDPOINTS.allReports.replace('/api/admin/reports/all', '');
    return imageUrl.startsWith('/') ? `${API_BASE}${imageUrl}` : `${API_BASE}/${imageUrl}`;
  };

  const countFor = (key) => {
    if (key === 'all')          return allReports.length;
    if (key === 'verified')     return allReports.filter((r) => r.researcherStatus === 'verified').length;
    if (key === 'unverified')   return allReports.filter((r) => r.researcherStatus !== 'verified').length;
    if (key === 'under_review') return allReports.filter((r) => r.researcherStatus === 'under_review').length;
    return 0;
  };

  const getStatusLabel = (status) => {
    if (status === 'verified')     return '✓ Verified';
    if (status === 'duplicate')    return '⧉ Duplicate';
    if (status === 'under_review') return '⏳ Under Review';
    return null;
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-container"><p>Loading reports...</p></div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="report-management">
        <div className="section-header">
          <h2>Report Management</h2>
          <button onClick={fetchReports} className="refresh-btn">↻ Refresh</button>
        </div>

        <div className="filter-tabs">
          {TAB_CONFIG.map(({ key, label }) => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label} ({countFor(key)})
            </button>
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}

        {reports.length === 0 ? (
          <div className="empty-state"><p>No reports found in this category</p></div>
        ) : (
          <div className="reports-list">
            {reports.map((report) => (
              <div key={report._id} className="report-card">
                <div className="report-header">
                  <h3>{report.specieName}</h3>
                  <div className="report-badges">
                    {report.researcherStatus && (
                      <span className="badge">{getStatusLabel(report.researcherStatus)}</span>
                    )}
                    {report.isSpam && <span className="badge">Spam</span>}
                    {report.isInappropriate && <span className="badge">Inappropriate</span>}
                    {report.analysis?.spam && !report.isSpam && (
                      <span className="badge" title="Auto-detected">Auto-Spam</span>
                    )}
                    {report.analysis?.inappropriate && !report.isInappropriate && (
                      <span className="badge" title="Auto-detected">Auto-Inappropriate</span>
                    )}
                  </div>
                </div>

                <div className="card-body">
                  {report.image && (
                    <div className="report-image-container">
                      <img
                        src={normalizeImageUrl(report.image)}
                        alt={report.specieName}
                        className="report-image"
                        onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="report-info" style={{ flex: 1, marginBottom: 0 }}>
                    <div className="info-row">
                      <strong>Health Status</strong>{report.healthStatus}
                    </div>
                    <div className="info-row">
                      <strong>Reported By</strong>{report.username}
                    </div>
                    <div className="info-row">
                      <strong>Location</strong>
                      {report.location?.latitude?.toFixed(5)}, {report.location?.longitude?.toFixed(5)}
                    </div>
                    <div className="info-row">
                      <strong>Reported At</strong>{report.timestamp}
                    </div>
                    <div className="info-row">
                      <strong>Comments</strong>{report.commentsCount || 0}
                    </div>
                    <div className="info-row">
                      <strong>Weather</strong>
                      {report.weatherConditions?.temperature || 'N/A'}
                    </div>
                    {report.flaggedBy && (
                      <div className="info-row">
                        <strong>Flagged By</strong>
                        {report.flaggedBy} ({new Date(report.flaggedAt).toLocaleString()})
                      </div>
                    )}

                  </div>
                </div>

                <div className="report-actions">
                  {filter === 'unverified' && (
                    <button className="btn-delete" onClick={() => handleDelete(report._id)}>
                      🗑 Delete Report
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ReportManagement;
