import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import "../styles/home.scss"
import {
  FileText,
  Files,
  CloudUpload,
  User,
  Sparkles,
  AlertCircle,
  X,
  RotateCcw,
  Check
} from 'lucide-react';
import { generateInterviewReport } from '../services/report.api';
import { getUserScopedKey, getCurrentUserId } from '../../../utils/userScope';
import { getSavedResumes, syncResumesFromDb } from '../../resume/services/resume.storage';

const STORAGE_KEY_JOB = 'career_ai_interview_draft_job_desc';
const STORAGE_KEY_SELF = 'career_ai_interview_draft_self_desc';
const STORAGE_KEY_FILE_META = 'career_ai_interview_draft_file_meta';
const STORAGE_KEY_FILE_DATA = 'career_ai_interview_draft_file_data';

// Helper to convert base64 dataURL back into a native File object
const dataURLtoFile = (dataurl, filename, type) => {
  try {
    const parts = dataurl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = type || (mimeMatch ? mimeMatch[1] : 'application/pdf');
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename || 'resume.pdf', {
      type: mime,
      lastModified: Date.now()
    });
  } catch (err) {
    console.warn('Could not restore File from storage:', err);
    return null;
  }
};

// Human-readable file size formatter
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// In-memory cache isolated per user
const inMemoryDraftByUser = {};
const getMemoryDraft = () => {
  const uid = getCurrentUserId();
  if (!inMemoryDraftByUser[uid]) {
    inMemoryDraftByUser[uid] = {
      jobDescription: '',
      selfDescription: '',
      resumeFile: null
    };
  }
  return inMemoryDraftByUser[uid];
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Initialize state from in-memory cache or localStorage
  const [jobDescription, setJobDescription] = useState(() => {
    const mem = getMemoryDraft();
    if (mem.jobDescription) return mem.jobDescription;
    try {
      return localStorage.getItem(getUserScopedKey(STORAGE_KEY_JOB)) || '';
    } catch {
      return '';
    }
  });

  const [selfDescription, setSelfDescription] = useState(() => {
    const mem = getMemoryDraft();
    if (mem.selfDescription) return mem.selfDescription;
    try {
      return localStorage.getItem(getUserScopedKey(STORAGE_KEY_SELF)) || '';
    } catch {
      return '';
    }
  });

  const [resumeFile, setResumeFile] = useState(() => {
    const mem = getMemoryDraft();
    if (mem.resumeFile) return mem.resumeFile;
    try {
      const metaStr = localStorage.getItem(getUserScopedKey(STORAGE_KEY_FILE_META));
      const b64 = localStorage.getItem(getUserScopedKey(STORAGE_KEY_FILE_DATA));
      if (metaStr && b64) {
        const meta = JSON.parse(metaStr);
        const restored = dataURLtoFile(b64, meta.name, meta.type);
        if (restored) {
          mem.resumeFile = restored;
          return restored;
        }
      }
    } catch (e) {
      console.warn('Error restoring resume file from localStorage:', e);
    }
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  // Existing saved resumes from workspace / database
  const [savedResumesList, setSavedResumesList] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');

  // Load existing resumes from storage & MongoDB
  useEffect(() => {
    try {
      const list = getSavedResumes();
      setSavedResumesList(list);
      syncResumesFromDb().then((fresh) => {
        if (Array.isArray(fresh)) setSavedResumesList(fresh);
      });
    } catch (e) {
      console.warn(e);
    }

    const handleResumesUpdated = () => {
      try {
        setSavedResumesList(getSavedResumes());
      } catch (e) {
        console.warn(e);
      }
    };

    window.addEventListener('career_resumes_updated', handleResumesUpdated);
    return () => {
      window.removeEventListener('career_resumes_updated', handleResumesUpdated);
    };
  }, []);

  // Sync draft whenever logged-in user changes
  useEffect(() => {
    const mem = getMemoryDraft();
    const loadedJob = mem.jobDescription || localStorage.getItem(getUserScopedKey(STORAGE_KEY_JOB)) || '';
    const loadedSelf = mem.selfDescription || localStorage.getItem(getUserScopedKey(STORAGE_KEY_SELF)) || '';
    setJobDescription(loadedJob);
    setSelfDescription(loadedSelf);

    const metaStr = localStorage.getItem(getUserScopedKey(STORAGE_KEY_FILE_META));
    const b64 = localStorage.getItem(getUserScopedKey(STORAGE_KEY_FILE_DATA));
    if (metaStr && b64) {
      try {
        const meta = JSON.parse(metaStr);
        const restored = dataURLtoFile(b64, meta.name, meta.type);
        setResumeFile(restored);
        mem.resumeFile = restored;
      } catch {
        setResumeFile(null);
      }
    } else {
      setResumeFile(mem.resumeFile || null);
    }
  }, [user?.id, user?.email]);

  // Sync state changes to in-memory cache and localStorage
  const handleJobDescriptionChange = (e) => {
    const val = e.target.value;
    setJobDescription(val);
    getMemoryDraft().jobDescription = val;
    try {
      localStorage.setItem(getUserScopedKey(STORAGE_KEY_JOB), val);
    } catch { }
    if (errorMsg) setErrorMsg('');
  };

  const handleSelfDescriptionChange = (e) => {
    const val = e.target.value;
    setSelfDescription(val);
    getMemoryDraft().selfDescription = val;
    try {
      localStorage.setItem(getUserScopedKey(STORAGE_KEY_SELF), val);
    } catch { }
    if (errorMsg) setErrorMsg('');
  };

  const saveFile = (file) => {
    const mem = getMemoryDraft();
    if (!file) {
      setResumeFile(null);
      mem.resumeFile = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
      try {
        localStorage.removeItem(getUserScopedKey(STORAGE_KEY_FILE_META));
        localStorage.removeItem(getUserScopedKey(STORAGE_KEY_FILE_DATA));
      } catch { }
      return;
    }

    setResumeFile(file);
    mem.resumeFile = file;
    setErrorMsg('');

    try {
      const meta = {
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
        lastModified: file.lastModified
      };
      localStorage.setItem(getUserScopedKey(STORAGE_KEY_FILE_META), JSON.stringify(meta));

      // Cache file base64 data if size is reasonable (<= 4.5MB) for surviving reloads
      if (file.size <= 4.5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            localStorage.setItem(getUserScopedKey(STORAGE_KEY_FILE_DATA), reader.result);
          } catch (err) {
            console.warn('File too large for localStorage quota; retained in memory:', err);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Could not store file meta in localStorage:', err);
    }
  };

  const handleSelectWorkspaceResume = (e) => {
    const id = e.target.value;
    setSelectedResumeId(id);
    if (id) {
      saveFile(null);
      const found = savedResumesList.find((r) => r.id === id);
      if (found && !selfDescription.trim() && found.data?.personal?.summary) {
        handleSelfDescriptionChange({ target: { value: found.data.personal.summary } });
      }
    }
    setErrorMsg('');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedResumeId('');
      saveFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedResumeId('');
      saveFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    saveFile(null);
  };

  const handleClearAll = () => {
    setJobDescription('');
    setSelfDescription('');
    setSelectedResumeId('');
    saveFile(null);
    setErrorMsg('');
    const mem = getMemoryDraft();
    mem.jobDescription = '';
    mem.selfDescription = '';
    mem.resumeFile = null;
    try {
      localStorage.removeItem(getUserScopedKey(STORAGE_KEY_JOB));
      localStorage.removeItem(getUserScopedKey(STORAGE_KEY_SELF));
      localStorage.removeItem(getUserScopedKey(STORAGE_KEY_FILE_META));
      localStorage.removeItem(getUserScopedKey(STORAGE_KEY_FILE_DATA));
    } catch { }
  };

  const handleCopy = () => {
    if (jobDescription) {
      navigator.clipboard.writeText(jobDescription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedResume = selectedResumeId
    ? savedResumesList.find((r) => r.id === selectedResumeId)
    : null;

  const handleGenerate = async () => {
    if (!jobDescription.trim() && !resumeFile && !selectedResume && !selfDescription.trim()) {
      setErrorMsg('Please paste a Job Description, select a saved Resume, or upload your Resume before generating.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile: selectedResume ? null : resumeFile,
        resumeData: selectedResume ? selectedResume.data : null
      });

      if (data && data.interviewReport && data.interviewReport._id) {
        // Auto reset form inputs and cached draft upon successful report generation
        handleClearAll();

        navigate(`/interview/${data.interviewReport._id}`, {
          state: { report: data.interviewReport }
        });
      } else {
        setErrorMsg('Failed to generate interview report. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Error generating interview report.');
    } finally {
      setLoading(false);
    }
  };

  const hasDraftContent = Boolean(
    jobDescription.trim() || selfDescription.trim() || resumeFile || selectedResumeId
  );

  return (
    <main className='home'>
      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#ef4444',
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '16px',
          maxWidth: '900px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="interview-input-grp">
        <div className='left'>
          <div className="panel-header">
            <span>Job Description</span>
            <FileText size={20} />
          </div>
          <div className="textarea-wrap">
            <textarea
              name="jobDescription"
              id="jobDescription"
              placeholder='Paste the job description here...'
              value={jobDescription}
              onChange={handleJobDescriptionChange}
            ></textarea>
            <button
              type="button"
              className="icon-btn copy-btn"
              onClick={handleCopy}
              aria-label="Copy job description"
              title={copied ? 'Copied!' : 'Copy job description'}
            >
              {copied ? (
                <Check size={18} strokeWidth={2.5} color="#10b981" />
              ) : (
                <Files size={18} strokeWidth={2.25} />
              )}
            </button>
          </div>
        </div>

        <div className="right">
          <div className="input_group">
            <div className="panel-header">
              <span>Upload Resume</span>
              <CloudUpload size={20} />
            </div>

            {selectedResume ? (
              <div className="selected-resume-card">
                <div className="selected-resume-info">
                  <FileText size={20} className="resume-icon" />
                  <div className="resume-text">
                    <span className="resume-title">{selectedResume.title || 'My ATS Resume'}</span>
                    <span className="resume-sub">
                      {selectedResume.data?.personal?.fullName ? `${selectedResume.data.personal.fullName} · ` : ''}
                      {selectedResume.data?.personal?.profession || 'Saved ATS Resume'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-remove-selected-resume"
                  onClick={() => setSelectedResumeId('')}
                  title="Deselect this resume and upload PDF instead"
                >
                  <X size={15} />
                  <span>Switch</span>
                </button>
              </div>
            ) : (
              <div
                className={`dropzone${isDragging ? ' dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={(e) => {
                  if (e.target.closest('.btn-remove-file')) return;
                  fileInputRef.current?.click();
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <CloudUpload size={32} strokeWidth={2} />
                <p className="dropzone-label">Drag & Drop Resume</p>
                <div className="choose-file-row">
                  <span className="btn btn-small">Choose File</span>
                  <span className={`file-status${resumeFile ? ' has-file' : ''}`}>
                    {resumeFile
                      ? `${resumeFile.name} (${formatFileSize(resumeFile.size)})`
                      : 'No file selected yet (.pdf)'}
                  </span>
                  {resumeFile && (
                    <button
                      type="button"
                      className="btn-remove-file"
                      onClick={handleRemoveFile}
                      title="Remove uploaded resume"
                    >
                      <X size={14} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  name="resume"
                  id="resume"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Select from existing saved resumes placed BELOW browse/dropzone */}
            {savedResumesList.length > 0 && (
              <div className="setup-workspace-select-row">
                <div className="resume-divider-row">
                  <span className="divider-line" />
                  <span className="divider-text">OR SELECT FROM SAVED RESUMES</span>
                  <span className="divider-line" />
                </div>
                <select
                  className="ws-select"
                  value={selectedResumeId}
                  onChange={handleSelectWorkspaceResume}
                >
                  <option value="">-- Choose from your saved resumes --</option>
                  {savedResumesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title || 'My ATS Resume'} {r.data?.personal?.profession ? `(${r.data.personal.profession})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="input_group">
            <div className="panel-header">
              <span>Self Description</span>
              <User size={20} strokeWidth={2.25} />
            </div>
            <div className="textarea-wrap">
              <textarea
                name="selfDescription"
                id="selfDescription"
                placeholder='Describe your skills, experience, and career goals...'
                value={selfDescription}
                onChange={handleSelfDescriptionChange}
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <div className="home-actions">
        <button
          type="button"
          className='btn generate-btn'
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
              <span>Analyzing & Generating Interview Report...</span>
            </span>
          ) : (
            <span>Generate Interview Report</span>
          )}
        </button>

        {hasDraftContent && (
          <button
            type="button"
            className="btn-reset-draft"
            onClick={handleClearAll}
            disabled={loading}
            title="Reset and clear all inputs"
          >
            <RotateCcw size={15} />
            <span>Reset </span>
          </button>
        )}
      </div>
    </main>
  );
};

export default Home;
