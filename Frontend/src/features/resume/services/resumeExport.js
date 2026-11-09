/**
 * Resume Export Service
 * Provides client-side downloading of resumes in PDF and DOCX (Word) formats.
 */

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatBulletsOrParagraph(desc) {
  if (!desc) return '';
  const lines = desc.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1 || lines.some((l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'))) {
    const listItems = lines
      .map((line) => {
        const cleanLine = line.replace(/^[•\-\*]\s*/, '');
        return `<li class="bullet-item">${escapeXml(cleanLine)}</li>`;
      })
      .join('\n');
    return `<ul class="bullet-list">${listItems}</ul>`;
  }
  return `<p class="item-desc">${escapeXml(desc)}</p>`;
}

/**
 * Generate Microsoft Word Compatible HTML Document
 */
export function generateWordHtml(resumeData, options = {}) {
  const { accentColor = '#2563eb' } = options;
  const p = resumeData.personal || {};
  const fullName = p.fullName || 'Candidate Resume';
  const profession = p.profession || '';

  const contactList = [
    p.email,
    p.phone ? (p.phone.startsWith('+') ? p.phone : `${p.countryCode || '+91'} ${p.phone}`) : '',
    p.location,
    p.linkedin,
    p.website
  ].filter(Boolean);

  const summary = resumeData.summary?.trim() || '';
  const experience = Array.isArray(resumeData.experience)
    ? resumeData.experience.filter((e) => e.role?.trim() || e.company?.trim() || e.description?.trim())
    : [];
  const education = Array.isArray(resumeData.education)
    ? resumeData.education.filter((e) => e.institution?.trim() || e.degree?.trim() || e.field?.trim())
    : [];
  const projects = Array.isArray(resumeData.projects)
    ? resumeData.projects.filter((pr) => pr.name?.trim() || pr.description?.trim())
    : [];
  const skills = Array.isArray(resumeData.skills) ? resumeData.skills.filter(Boolean) : [];

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeXml(fullName)} - Resume</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 8.5in 11.0in;
      margin: 0.75in 0.75in 0.75in 0.75in;
      mso-header-margin: 0.5in;
      mso-footer-margin: 0.5in;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }
    .header-box {
      text-align: center;
      margin-bottom: 14pt;
      border-bottom: 2pt solid ${accentColor};
      padding-bottom: 10pt;
    }
    .candidate-name {
      font-size: 24pt;
      font-weight: bold;
      color: ${accentColor};
      margin: 0 0 3pt 0;
    }
    .candidate-title {
      font-size: 13pt;
      font-weight: 600;
      color: #475569;
      margin: 0 0 6pt 0;
    }
    .contact-row {
      font-size: 9.5pt;
      color: #64748b;
      margin: 0;
    }
    .section-heading {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      color: #0f172a;
      border-bottom: 1.5pt solid ${accentColor};
      padding-bottom: 2pt;
      margin-top: 14pt;
      margin-bottom: 6pt;
    }
    .summary-text {
      font-size: 10.5pt;
      color: #334155;
      line-height: 1.45;
      margin: 0 0 10pt 0;
    }
    .item-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6pt;
      margin-bottom: 2pt;
    }
    .item-title {
      font-size: 11pt;
      font-weight: bold;
      color: #0f172a;
      text-align: left;
    }
    .item-date {
      font-size: 10pt;
      font-weight: normal;
      color: #64748b;
      text-align: right;
    }
    .item-subtitle {
      font-size: 10pt;
      font-style: italic;
      color: #475569;
      margin: 1pt 0 4pt 0;
    }
    .item-desc {
      font-size: 10pt;
      color: #334155;
      margin: 2pt 0 6pt 0;
      line-height: 1.4;
    }
    ul.bullet-list {
      margin: 2pt 0 6pt 16pt;
      padding: 0;
    }
    li.bullet-item {
      font-size: 10pt;
      color: #334155;
      margin-bottom: 3pt;
      line-height: 1.4;
    }
    .skills-container {
      margin-top: 4pt;
    }
    .skill-tag {
      font-size: 10pt;
      color: #1e293b;
      background-color: #f1f5f9;
      padding: 3pt 6pt;
      margin-right: 4pt;
      margin-bottom: 4pt;
      display: inline-block;
      border-radius: 3pt;
    }
  </style>
</head>
<body>
  <div class="Section1">
    <!-- Header -->
    <div class="header-box">
      <h1 class="candidate-name">${escapeXml(fullName)}</h1>
      ${profession ? `<div class="candidate-title">${escapeXml(profession)}</div>` : ''}
      ${contactList.length > 0 ? `<div class="contact-row">${contactList.map((c) => escapeXml(c)).join(' &nbsp;•&nbsp; ')}</div>` : ''}
    </div>

    <!-- Summary -->
    ${
      summary
        ? `
      <div class="section-heading">Professional Summary</div>
      <p class="summary-text">${escapeXml(summary)}</p>
    `
        : ''
    }

    <!-- Experience -->
    ${
      experience.length > 0
        ? `
      <div class="section-heading">Professional Experience</div>
      ${experience
        .map(
          (exp) => `
        <table class="item-table" width="100%">
          <tr>
            <td class="item-title">${escapeXml(exp.role || 'Job Title')}</td>
            <td class="item-date">
              ${exp.startDate || exp.endDate ? escapeXml(`${exp.startDate || ''} - ${exp.currentlyWorking ? 'Present' : exp.endDate || ''}`) : ''}
            </td>
          </tr>
        </table>
        ${exp.company ? `<div class="item-subtitle">${escapeXml(exp.company)}</div>` : ''}
        ${formatBulletsOrParagraph(exp.description)}
      `
        )
        .join('')}
    `
        : ''
    }

    <!-- Education -->
    ${
      education.length > 0
        ? `
      <div class="section-heading">Education</div>
      ${education
        .map(
          (edu) => `
        <table class="item-table" width="100%">
          <tr>
            <td class="item-title">${escapeXml(edu.degree || 'Degree')}${edu.field ? ` in ${escapeXml(edu.field)}` : ''}</td>
            <td class="item-date">${escapeXml(edu.date || '')}</td>
          </tr>
        </table>
        ${edu.institution ? `<div class="item-subtitle">${escapeXml(edu.institution)}</div>` : ''}
        ${edu.gpa ? `<div class="item-desc">GPA: ${escapeXml(edu.gpa)}</div>` : ''}
      `
        )
        .join('')}
    `
        : ''
    }

    <!-- Projects -->
    ${
      projects.length > 0
        ? `
      <div class="section-heading">Projects</div>
      ${projects
        .map(
          (proj) => `
        <table class="item-table" width="100%">
          <tr>
            <td class="item-title">${escapeXml(proj.name || 'Project')}</td>
            <td class="item-date">${escapeXml(proj.type || '')}</td>
          </tr>
        </table>
        ${formatBulletsOrParagraph(proj.description)}
      `
        )
        .join('')}
    `
        : ''
    }

    <!-- Skills -->
    ${
      skills.length > 0
        ? `
      <div class="section-heading">Skills & Competencies</div>
      <div class="skills-container">
        ${skills.map((s) => `<span class="skill-tag">${escapeXml(s)}</span>`).join(' ')}
      </div>
    `
        : ''
    }
  </div>
</body>
</html>`;
}

/**
 * Trigger download of the resume as a formatted DOCX (Word) document
 */
export function downloadResumeAsDocx(resumeData, options = {}) {
  const htmlContent = generateWordHtml(resumeData, options);
  const fullName = resumeData?.personal?.fullName?.trim() || 'My';
  const sanitizedName = fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${sanitizedName}_Resume.docx`;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger browser print to PDF with sanitized document title
 */
export function downloadResumeAsPdf(resumeData) {
  const fullName = resumeData?.personal?.fullName?.trim() || 'My';
  const sanitizedName = fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const originalTitle = document.title;
  document.title = `${sanitizedName}_Resume`;
  window.print();
  setTimeout(() => {
    document.title = originalTitle;
  }, 1500);
}

