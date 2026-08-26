import React, { useRef, useState } from 'react'
import "../styles/home.scss"
import { FileText , Files, CloudUpload , User} from 'lucide-react';

const Home = () => {
  const [jobDescription, setJobDescription] = useState('')
  const [selfDescription, setSelfDescription] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleCopy = () => {
    if (jobDescription) navigator.clipboard.writeText(jobDescription)
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setResumeFile(e.target.files[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setResumeFile(e.dataTransfer.files[0])
  }

  return (
    <main className='home'>
      <h1 className="page-title">Interview Report Dashboard</h1>

      <div className="interview-input-grp">
        <div className='left'>
          <div className="panel-header">
            <span>Job Description</span>
            <FileText />
          </div>
          <div className="textarea-wrap">
            <textarea
              name="jobDescription"
              id="jobDescription"
              placeholder='Paste the job description here...'
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            ></textarea>
            <button type="button" className="icon-btn copy-btn" onClick={handleCopy} aria-label="Copy job description">
              <Files size={256} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <div className="right">
          <div className="input_group">
            <div className="panel-header">
              <span>Upload Resume</span>
            </div>

            <label
              htmlFor="resume"
              className={`dropzone${isDragging ? ' dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <CloudUpload size={256} strokeWidth={2.25} />
              <p className="dropzone-label">Drag & Drop</p>
              <div className="choose-file-row">
                <span className="btn btn-small">Choose File</span>
                <span className="file-status">{resumeFile ? resumeFile.name : 'No file selected yet'}</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                name="resume"
                id="resume"
                accept=".pdf"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="input_group">
            <div className="panel-header">
              <span>Self Description</span>
              <User size={128} strokeWidth={2.25} />
            </div>
            <div className="textarea-wrap">
              <textarea
                name="selfDescription"
                id="selfDescription"
                placeholder={selfDescription === '' ? '  Describe your skills, experience, and career goals...' : ''}
                value={selfDescription}
                onChange={(e) => setSelfDescription(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <button className='btn generate-btn'>Generate Interview Report</button>
    </main>
  )
}

export default Home
