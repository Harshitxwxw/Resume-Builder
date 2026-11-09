// Storage and state service for User Profile
import { getSavedResumes } from '../../resume/services/resume.storage'
import { getUserScopedKey, getCurrentUser } from '../../../utils/userScope'
import { fetchProfileFromDb, updateProfileInDb } from './profile.api'

const USER_PROFILE_KEY = 'career_ai_user_profile'
const PROFILE_EVENT_NAME = 'career_profile_updated'

export const DEFAULT_PROFILE_DATA = {
  fullName: '',
  title: 'Software Developer',
  email: '',
  phone: '',
  location: '',
  website: '',
  github: '',
  linkedin: '',
  avatarInitials: 'U',
  badge: 'Candidate',
  yearsExperience: 'Fresher / Experienced',
  atsIndex: '85%',
  
  // Self description / About me
  aboutMe: `Dedicated and impact-driven Full Stack Software Engineer with 4+ years of hands-on experience in architecting scalable web applications, designing high-throughput distributed systems, and developing AI-powered career tools. 

Specialized in React, Next.js, Node.js, TypeScript, and modern cloud infrastructures (AWS & Docker). Passionate about writing clean, modular code, optimizing frontend performance and core web vitals, and bridging robust engineering with user-centric product design. Known for strong technical leadership, mentoring junior developers, and delivering mission-critical features in agile environments.`,

  // Core Skills categorized
  skills: {
    frontend: [
      { name: 'React.js', level: 'Expert' },
      { name: 'Next.js', level: 'Advanced' },
      { name: 'TypeScript', level: 'Advanced' },
      { name: 'JavaScript (ES6+)', level: 'Expert' },
      { name: 'Tailwind CSS & SCSS', level: 'Expert' },
      { name: 'Redux Toolkit & Zustand', level: 'Advanced' },
      { name: 'HTML5 & Responsive UX', level: 'Expert' }
    ],
    backend: [
      { name: 'Node.js', level: 'Expert' },
      { name: 'Express.js', level: 'Expert' },
      { name: 'RESTful API Architecture', level: 'Expert' },
      { name: 'GraphQL', level: 'Intermediate' },
      { name: 'Microservices & WebSockets', level: 'Advanced' },
      { name: 'JWT & OAuth 2.0 Auth', level: 'Advanced' }
    ],
    databases: [
      { name: 'MongoDB & Mongoose', level: 'Advanced' },
      { name: 'PostgreSQL', level: 'Advanced' },
      { name: 'Redis Caching', level: 'Intermediate' },
      { name: 'Prisma ORM', level: 'Intermediate' }
    ],
    devops: [
      { name: 'Docker & Containers', level: 'Advanced' },
      { name: 'AWS (S3, EC2, CloudFront)', level: 'Intermediate' },
      { name: 'Git & GitHub Workflows', level: 'Expert' },
      { name: 'CI/CD Pipelines (GitHub Actions)', level: 'Intermediate' },
      { name: 'Vite & Webpack', level: 'Advanced' },
      { name: 'Linux / Shell Scripting', level: 'Intermediate' }
    ],
    methodologies: [
      { name: 'System Design & Scalability', level: 'Advanced' },
      { name: 'Agile / Scrum Methodologies', level: 'Expert' },
      { name: 'Unit & E2E Testing (Jest)', level: 'Intermediate' },
      { name: 'Performance Optimization', level: 'Advanced' },
      { name: 'Technical Mentorship', level: 'Advanced' }
    ]
  },

  // Featured Projects
  projects: [
    {
      id: 'p1',
      title: 'CareerAI - Intelligent Resume & Interview Roadmap Suite',
      category: 'Full Stack & GenAI',
      role: 'Lead Architect',
      period: '2024 - Present',
      description: 'Engineered an end-to-end career readiness workspace leveraging Google Gemini AI. Generates tailored role-specific interview roadmaps, technical & behavioral drill questions, ATS compatibility scoring, and interactive resume builder.',
      techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Gemini API', 'SCSS'],
      liveUrl: 'https://career-ai.example.com',
      githubUrl: 'https://github.com/kranti-dev/career-ai',
      featured: true,
      metrics: 'Over 1,200+ roadmaps and 800+ resumes generated with 92% satisfaction'
    },
    {
      id: 'p2',
      title: 'Distributed Real-Time Cloud Inventory Engine',
      category: 'Backend Microservices',
      role: 'Backend Engineer',
      period: '2023 - 2024',
      description: 'Architected high-concurrency microservices pipeline handling multi-warehouse stock allocations. Implemented Redis caching layers and message queuing to guarantee zero race-condition stock overselling during flash sales.',
      techStack: ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'BullMQ'],
      liveUrl: 'https://inventory-demo.example.com',
      githubUrl: 'https://github.com/kranti-dev/cloud-inventory',
      featured: true,
      metrics: 'Maintained 99.98% uptime under 10k req/min traffic bursts'
    },
    {
      id: 'p3',
      title: 'Interactive Plan Tracker & Task Management Hub',
      category: 'Frontend Engineering',
      role: 'Full Stack Developer',
      period: '2023',
      description: 'Built a sleek Kanban and Day-by-Day roadmap tracker with live status synchronization, animated progress gauges, multi-state task checking, and offline local persistence.',
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
      liveUrl: 'https://plan-tracker.example.com',
      githubUrl: 'https://github.com/kranti-dev/plan-tracker',
      featured: false,
      metrics: '35% reduction in task completion friction for candidates'
    }
  ],

  // Work Experience
  experience: [
    {
      id: 'exp1',
      role: 'Senior Full Stack Software Engineer',
      company: 'TechInnovate Solutions Inc.',
      location: 'Bengaluru, India (Hybrid)',
      startDate: 'Jan 2023',
      endDate: 'Present',
      currentlyWorking: true,
      achievements: [
        'Spearheaded frontend architecture overhaul using React and modular SCSS, improving First Contentful Paint by 42%.',
        'Designed and deployed resilient REST APIs serving 50,000+ daily active users with sub-100ms response times.',
        'Mentored 6 junior and mid-level software engineers on modern clean code paradigms, Git flow, and effective system design.'
      ]
    },
    {
      id: 'exp2',
      role: 'Software Engineer',
      company: 'CloudScale Technologies',
      location: 'Pune, India',
      startDate: 'Aug 2021',
      endDate: 'Dec 2022',
      currentlyWorking: false,
      achievements: [
        'Built microservices in Node.js and MongoDB to ingest telemetry data from multiple partner platforms.',
        'Containerized production deployments using Docker and configured automated CI/CD checks via GitHub Actions.',
        'Authored comprehensive API documentation and automated test suites achieving 88% unit test coverage.'
      ]
    }
  ],

  // Education
  education: [
    {
      id: 'edu1',
      degree: 'Bachelor of Technology in Computer Science & Engineering',
      institution: 'National Institute of Technology / Apex Institute',
      location: 'India',
      period: '2017 - 2021',
      grade: 'CGPA: 8.8 / 10.0',
      highlights: 'Department Gold Medalist, President of Coding Society, Organized Hackathons.'
    }
  ],

  // Certifications
  certifications: [
    {
      name: 'AWS Certified Solutions Architect - Associate',
      issuer: 'Amazon Web Services',
      year: '2023'
    },
    {
      name: 'Meta Front-End Developer Professional Certificate',
      issuer: 'Meta (Coursera)',
      year: '2022'
    }
  ]
}

/**
 * Get current profile from localStorage or initialize with defaults & auth user
 */
export const getUserProfile = (authUser = null) => {
  const user = authUser || getCurrentUser();
  const scopedKey = getUserScopedKey(USER_PROFILE_KEY);
  try {
    const raw = localStorage.getItem(scopedKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      // If authUser is provided, keep username/email fresh if not custom
      if (user?.username && !parsed.fullNameSetManually) {
        parsed.fullName = user.username;
        parsed.avatarInitials = user.username[0]?.toUpperCase() || 'U';
      }
      if (user?.email && !parsed.emailSetManually) {
        parsed.email = user.email;
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse user profile:', err);
  }

  // Fallback initialize for this user
  const initial = { ...DEFAULT_PROFILE_DATA };
  if (user?.username) {
    initial.fullName = user.username;
    initial.avatarInitials = user.username[0]?.toUpperCase() || 'U';
  }
  if (user?.email) {
    initial.email = user.email;
  }

  // Attempt to sync from this user's existing saved resumes
  try {
    const savedResumes = getSavedResumes();
    if (savedResumes && savedResumes.length > 0) {
      const latest = savedResumes[0];
      if (latest?.data?.personal) {
        const p = latest.data.personal;
        if (p.fullName) initial.fullName = p.fullName;
        if (p.email) initial.email = p.email;
        if (p.phone) initial.phone = `${p.countryCode || '+91'} ${p.phone}`;
        if (p.location) initial.location = p.location;
        if (p.profession) initial.title = p.profession;
        if (p.linkedin) initial.linkedin = p.linkedin;
        if (p.website) initial.website = p.website;
      }
      if (latest?.data?.summary) {
        initial.aboutMe = latest.data.summary;
      }
    }
  } catch (e) {
    console.warn('Could not read resume for profile sync:', e);
  }

  try {
    localStorage.setItem(scopedKey, JSON.stringify(initial));
  } catch (e) {
    console.warn(e);
  }

  return initial;
};

export const syncProfileFromDb = async () => {
  try {
    const profile = await fetchProfileFromDb();
    if (profile) {
      const scopedKey = getUserScopedKey(USER_PROFILE_KEY);
      localStorage.setItem(scopedKey, JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent(PROFILE_EVENT_NAME, { detail: profile }));
      return profile;
    }
  } catch (err) {
    console.warn('Could not sync profile from DB:', err);
  }
  return getUserProfile();
};

/**
 * Save updated user profile
 */
export const saveUserProfile = (profileData) => {
  try {
    const scopedKey = getUserScopedKey(USER_PROFILE_KEY);
    const dataToSave = {
      ...profileData,
      fullNameSetManually: true,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(scopedKey, JSON.stringify(dataToSave));
    try {
      window.dispatchEvent(new CustomEvent(PROFILE_EVENT_NAME, { detail: dataToSave }));
    } catch (e) {}

    // Persist to MongoDB
    updateProfileInDb(dataToSave).catch((err) => console.warn('Could not update profile in DB:', err));

    return true;
  } catch (err) {
    console.error('Failed to save profile:', err);
    return false;
  }
};

/**
 * Sync profile directly from latest created resume
 */
export const syncProfileFromLatestResume = () => {
  const savedResumes = getSavedResumes()
  if (!savedResumes || savedResumes.length === 0) {
    return { success: false, message: 'No created resumes found to sync from.' }
  }

  const latest = savedResumes[0]
  const current = getUserProfile()

  if (latest.data?.personal) {
    const p = latest.data.personal
    if (p.fullName?.trim()) current.fullName = p.fullName
    if (p.email?.trim()) current.email = p.email
    if (p.phone?.trim()) current.phone = `${p.countryCode || '+91'} ${p.phone}`
    if (p.location?.trim()) current.location = p.location
    if (p.profession?.trim()) current.title = p.profession
    if (p.linkedin?.trim()) current.linkedin = p.linkedin
    if (p.website?.trim()) current.website = p.website
  }

  if (latest.data?.summary?.trim()) {
    current.aboutMe = latest.data.summary
  }

  if (Array.isArray(latest.data?.skills) && latest.data.skills.length > 0) {
    // Add any new skills to frontend category
    const existingSkillNames = new Set(
      Object.values(current.skills).flat().map((s) => s.name.toLowerCase())
    )
    latest.data.skills.forEach((s) => {
      const name = typeof s === 'string' ? s : s.name
      if (name && !existingSkillNames.has(name.toLowerCase())) {
        current.skills.frontend.push({ name, level: 'Proficient' })
        existingSkillNames.add(name.toLowerCase())
      }
    })
  }

  saveUserProfile(current)
  return { success: true, message: `Successfully synchronized from "${latest.title || 'Latest Resume'}".` }
}

