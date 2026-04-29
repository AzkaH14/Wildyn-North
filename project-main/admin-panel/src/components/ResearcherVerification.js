import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../config/api';
import { RefreshCw, Microscope, Mail, CalendarDays, BadgeCheck, ShieldAlert } from 'lucide-react';
import { validateOrcid } from '../utils/orcid';
import './ResearcherVerification.css';

const ResearcherVerification = ({ admin }) => {
  // now renamed to simply show all researchers, since verification step removed
  const [researchers, setResearchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResearchers();
  }, []);

  const fetchResearchers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ADMIN_ENDPOINTS.allResearchers);
      setResearchers(response.data.researchers || []);
      setError('');
    } catch (err) {
      setError('Failed to load researchers');
      console.error('Error fetching researchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifiedCount = researchers.filter((r) => r.verified).length;
  const pendingCount = researchers.length - verifiedCount;

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading researchers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <p>{error}</p>
        <button onClick={fetchResearchers} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="researcher-verification">
      <div className="section-header">
        <div>
          <h2>All Researchers</h2>
          <p className="section-subtitle">Researcher profiles and verification status overview</p>
        </div>
        <button onClick={fetchResearchers} className="refresh-btn">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="rv-stats">
        <div className="rv-stat-card">
          <span className="rv-stat-value">{researchers.length}</span>
          <span className="rv-stat-label">Total Researchers</span>
        </div>
        <div className="rv-stat-card rv-stat-ok">
          <span className="rv-stat-value">{verifiedCount}</span>
          <span className="rv-stat-label">Verified</span>
        </div>
        <div className="rv-stat-card rv-stat-pending">
          <span className="rv-stat-value">{pendingCount}</span>
          <span className="rv-stat-label">Pending</span>
        </div>
      </div>

      {researchers.length === 0 ? (
        <div className="empty-state">
          <p>No researchers found</p>
        </div>
      ) : (
        <div className="researchers-list">
          {researchers.map((researcher) => (
            <div key={researcher._id} className="researcher-card">
              <div className="researcher-header">
                <div className="researcher-title-wrap">
                  <div className="researcher-avatar">
                    <Microscope size={20} />
                  </div>
                  <h3>{researcher.username}</h3>
                </div>
                <span className={`badge ${researcher.verified ? 'verified' : 'pending'}`}>
                  {researcher.verified ? '✓ Verified' : '⏳ Pending'}
                </span>
              </div>

              <div className="researcher-info">
                <div className="info-row">
                  <strong><Mail size={14} /> Email:</strong> {researcher.email}
                </div>
                {researcher.education && (
                  <>
                    <div className="info-row">
                      <strong>Highest Degree:</strong> {researcher.education.highestDegree}
                    </div>
                    <div className="info-row">
                      <strong>Field of Study:</strong> {researcher.education.fieldOfStudy}
                    </div>
                    <div className="info-row">
                      <strong>Institution:</strong> {researcher.education.institution}
                    </div>
                    <div className="info-row">
                      <strong>Graduation Year:</strong> {researcher.education.graduationYear}
                    </div>
                    <div className="info-row">
                      <strong>Specialization:</strong> {researcher.education.specialization}
                    </div>
                    {researcher.education.certifications && (
                      <div className="info-row">
                        <strong>Certifications:</strong> {researcher.education.certifications}
                      </div>
                    )}
                  </>
                )}
                <div className="info-row">
                  <strong>{researcher.verified ? <BadgeCheck size={14} /> : <ShieldAlert size={14} />} ORCID:</strong>{' '}
                  <span className={validateOrcid(researcher.orcid).isValid ? 'valid-orcid' : 'invalid-orcid'}>
                    {researcher.orcid || '(none)'}
                  </span>
                </div>
                <div className="info-row">
                  <strong><CalendarDays size={14} /> Registered:</strong>{' '}
                  {new Date(researcher.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResearcherVerification;
