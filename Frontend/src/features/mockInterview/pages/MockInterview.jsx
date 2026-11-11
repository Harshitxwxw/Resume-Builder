import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Briefcase,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  FilePlus,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Play,
  RotateCcw,
  Check,
  AlertCircle,
  Coins
} from 'lucide-react';
import AvatarInterviewer from '../components/AvatarInterviewer';
import {
  setupMockInterviewApi,
  evaluateAnswerApi,
  generateInterviewReportApi
} from '../services/mockInterview.api';
import { saveMockReport, getSavedMockReports } from '../services/mockInterview.storage';
import { getSavedResumes, syncResumesFromDb } from '../../resume/services/resume.storage';
import {
  getUserCredits,
  deductCredits,
  addCredits,
  MOCK_INTERVIEW_COST,
  HIGH_SCORE_MOCK_REWARD
} from '../../credits/services/credits.storage';
import '../styles/mockInterview.scss';

const DEFAULT_QUESTIONS = [
  {
    id: 1,
    difficulty: 'Easy',
    timeLimit: 60,
    category: 'Project Overview',
    text: 'Can you briefly introduce yourself and walk me through one of the key projects on your resume?'
  },
  {
    id: 2,
    difficulty: 'Easy',
    timeLimit: 60,
    category: 'Core Fundamentals',
    text: 'What core technologies and principles did you rely on in that project, and why?'
  },
  {
    id: 3,
    difficulty: 'Medium',
    timeLimit: 90,
    category: 'Practical Problem Solving',
    text: 'Describe a challenging technical problem or bug you solved in your development experience.'
  },
  {
    id: 4,
    difficulty: 'Medium',
    timeLimit: 90,
    category: 'Architecture & Trade-offs',
    text: 'What architectural decisions or trade-offs did you make to ensure performance and reliability?'
  },
  {
    id: 5,
    difficulty: 'Hard',
    timeLimit: 120,
    category: 'System Design & Scalability',
    text: 'If your application had to scale to thousands of daily active users, how would you architect and deploy it?'
  }
];

export default function MockInterview() {
  const navigate = useNavigate();

  // Workflow Stages: 'setup' | 'interview' | 'report'
  const [stage, setStage] = useState('setup');

  // Setup Form State (No default hardcoded values)
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [interviewType, setInterviewType] = useState('Technical Interview'); // 'Technical Interview' | 'HR Interview'
  const [resumePdfFile, setResumePdfFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [savedResumesList, setSavedResumesList] = useState([]);

  // Interview Questions & Session State
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [sessionResults, setSessionResults] = useState([]); // [{ question, answer, evaluation, timeSpent }]
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState(false);

  // Timer State (60s, 90s, 120s based on question difficulty)
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [totalTimeForCurrent, setTotalTimeForCurrent] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Speech Recognition (Mic) State
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const baseTextRef = useRef('');
  const currentAnswerRef = useRef('');

  useEffect(() => {
    currentAnswerRef.current = currentAnswer;
  }, [currentAnswer]);

  // Text to Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Final Report State
  const [reportData, setReportData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Credits System State
  const [userCredits, setUserCredits] = useState(() => getUserCredits());
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [highScoreAwarded, setHighScoreAwarded] = useState(null);

  // Sync user credits on updates
  useEffect(() => {
    const handleCreditsUpdate = () => {
      setUserCredits(getUserCredits());
    };
    const handleAuthChange = () => {
      setUserCredits(getUserCredits());
      try {
        setSavedResumesList(getSavedResumes());
      } catch (e) {
        console.warn(e);
      }
    };
    const handleResumesChange = () => {
      try {
        setSavedResumesList(getSavedResumes());
      } catch (e) {
        console.warn(e);
      }
    };
    window.addEventListener('career_credits_updated', handleCreditsUpdate);
    window.addEventListener('career_auth_changed', handleAuthChange);
    window.addEventListener('career_resume_saved', handleResumesChange);
    return () => {
      window.removeEventListener('career_credits_updated', handleCreditsUpdate);
      window.removeEventListener('career_auth_changed', handleAuthChange);
      window.removeEventListener('career_resume_saved', handleResumesChange);
    };
  }, []);

  // Load existing resumes from workspace storage & MongoDB
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
  }, []);

  // Load saved mock report from query string (e.g. from Dashboard)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('reportId');
    if (reportId) {
      const saved = getSavedMockReports();
      const target = saved.find((item) => item.id === reportId);
      if (target && target.report) {
        setReportData(target.report);
        setRole(target.role || target.report.role || '');
        setInterviewType(target.interviewType || target.report.interviewType || 'Technical Interview');
        setStage('report');
      }
    }
  }, []);

  // Stop Voice Recognition & Release Hardware Microphone Tracks
  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('SpeechRecognition stop error:', e);
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('MediaRecorder stop error:', e);
      }
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('MediaStream stop error:', e);
      }
      mediaStreamRef.current = null;
    }
  };

  // Start Voice Recognition with real-time text box streaming and manual edit support
  const startRecording = async () => {
    // If AI is currently speaking, silence it so audio doesn't echo into mic
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    // Clean up any existing session cleanly
    stopRecording();

    // 1. Request microphone hardware access via getUserMedia
    // This triggers the browser's native "Allow microphone" prompt if not already granted
    let stream = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      } catch (err) {
        console.warn('Microphone permission / access error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setToastMessage('⚠️ Microphone access denied. Please click the camera/mic icon in your browser address bar to allow microphone access.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setToastMessage('⚠️ No microphone found. Please connect a microphone or headset.');
        } else {
          setToastMessage(`⚠️ Microphone error: ${err.message || 'Cannot access microphone'}`);
        }
        setTimeout(() => setToastMessage(''), 4000);
        setIsRecording(false);
        isRecordingRef.current = false;
        return;
      }
    }

    isRecordingRef.current = true;
    setIsRecording(true);

    // 2. Initialize Web Speech Recognition if available (Chrome, Edge, Safari, Brave)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        // Snapshot existing text from textarea
        baseTextRef.current = currentAnswerRef.current || '';

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsRecording(true);
          isRecordingRef.current = true;
        };

        recognition.onresult = (event) => {
          let interim = '';
          let finalNew = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              finalNew += res[0].transcript + ' ';
            } else {
              interim += res[0].transcript;
            }
          }

          if (finalNew) {
            const prevBase = baseTextRef.current ? baseTextRef.current.trim() + ' ' : '';
            baseTextRef.current = prevBase + finalNew;
          }

          const currentFinal = baseTextRef.current ? baseTextRef.current.trim() : '';
          const combined = interim
            ? (currentFinal ? `${currentFinal} ${interim.trim()}` : interim.trim())
            : currentFinal;

          setCurrentAnswer(combined);
          currentAnswerRef.current = combined;
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition error event:', event.error);
          if (event.error === 'no-speech') {
            // Keep listening, do not abort
            return;
          }
          if (event.error === 'not-allowed') {
            stopRecording();
            setToastMessage('⚠️ Speech recognition permission denied. Please allow microphone in browser address bar.');
            setTimeout(() => setToastMessage(''), 4000);
            return;
          }
          if (event.error === 'audio-capture') {
            stopRecording();
            setToastMessage('⚠️ No microphone audio captured. Check your microphone settings.');
            setTimeout(() => setToastMessage(''), 4000);
            return;
          }
          if (event.error === 'network') {
            console.warn('Speech recognition cloud offline, keeping mic stream active.');
            return;
          }
        };

        recognition.onend = () => {
          // If user hasn't explicitly stopped recording, auto-restart to prevent Chrome's silence auto-cutoff
          if (isRecordingRef.current) {
            try {
              recognition.start();
            } catch {
              setTimeout(() => {
                if (isRecordingRef.current && recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch {
                    // Ignore transient restart errors
                  }
                }
              }, 150);
            }
          } else {
            setIsRecording(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    } else {
      // Browser does not support Web Speech API (e.g. Firefox)
      if (stream && typeof MediaRecorder !== 'undefined') {
        try {
          const mr = new MediaRecorder(stream);
          mr.start();
          mediaRecorderRef.current = mr;
          setToastMessage('🎙️ Microphone active & recording! (Speech-to-text requires Chrome/Edge, or you can type directly).');
          setTimeout(() => setToastMessage(''), 3500);
        } catch (e) {
          console.warn('MediaRecorder error:', e);
        }
      } else {
        setToastMessage('🎙️ Microphone active! Type your answer in the box below.');
        setTimeout(() => setToastMessage(''), 3000);
      }
    }
  };

  // Toggle Voice Recognition (Mic)
  const toggleRecording = () => {
    if (isRecording || isRecordingRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup speech synthesis & mic on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Timer Tick Hook
  useEffect(() => {
    let timerId = null;
    if (stage === 'interview' && isTimerRunning && timeRemaining > 0) {
      timerId = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [stage, isTimerRunning, timeRemaining]);

  // Auto-submit answer when timer reaches 0
  useEffect(() => {
    if (
      stage === 'interview' &&
      timeRemaining === 0 &&
      !hasSubmittedCurrent &&
      !isEvaluatingAnswer &&
      questions.length > 0
    ) {
      setToastMessage('Time is up! Submitting answer for AI evaluation...');
      setTimeout(() => setToastMessage(''), 3000);
      handleSubmitAnswer();
    }
  }, [timeRemaining, stage, hasSubmittedCurrent, isEvaluatingAnswer, questions]);

  // Speak text aloud (for questions and feedback). Timer callback fires when speaking finishes.
  const speakText = (text, onComplete) => {
    if (isMuted || !('speechSynthesis' in window) || !text) {
      if (onComplete) onComplete();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onComplete) onComplete();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (onComplete) onComplete();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      setIsSpeaking(false);
      if (onComplete) onComplete();
    }
  };


  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumePdfFile(file);
      setResumeFileName(file.name);
      setSelectedResumeId('');
    }
  };

  // Handle Workspace Resume Selection
  const handleSelectWorkspaceResume = (e) => {
    const id = e.target.value;
    setSelectedResumeId(id);
    setResumePdfFile(null);
    const found = savedResumesList.find((r) => r.id === id);
    if (found) {
      setResumeFileName(found.title || 'Workspace Resume');
      if (found.data?.personal?.profession) {
        setRole(found.data.personal.profession);
      }
    }
  };

  // Analyze Resume Action
  const handleAnalyzeResume = async () => {
    setIsAnalyzingResume(true);
    let resumeData = null;
    if (selectedResumeId) {
      const found = savedResumesList.find((r) => r.id === selectedResumeId);
      if (found) resumeData = found.data;
    }

    try {
      const rawRes = await setupMockInterviewApi({
        role,
        experience,
        interviewType,
        resumePdfFile,
        resumeData
      });

      const setupResult = rawRes?.result || rawRes;
      const parsedProfile = setupResult?.parsedProfile || {
        role: role || 'Software Developer',
        projects: ['Full-Stack Web Project'],
        skills: ['Problem Solving', 'System Architecture', 'Technical Communication']
      };

      const questionsList = Array.isArray(setupResult?.questions) && setupResult.questions.length > 0
        ? setupResult.questions
        : DEFAULT_QUESTIONS;

      setAnalysisResult(parsedProfile);
      setQuestions(questionsList);
      setToastMessage('Resume analyzed successfully!');
      setTimeout(() => setToastMessage(''), 2500);
    } catch (err) {
      console.error('handleAnalyzeResume error:', err);
      // Safe fallback profile and questions so the user is never blocked
      setAnalysisResult({
        role: role || 'Software Developer',
        projects: ['Full-Stack Web Project'],
        skills: ['Problem Solving', 'System Architecture', 'Technical Communication']
      });
      setQuestions(DEFAULT_QUESTIONS);
      setToastMessage('Resume analyzed (fallback questions ready)');
      setTimeout(() => setToastMessage(''), 2500);
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  // Start Interview Action (Requires Analyzed Resume & 50 Credits)
  const handleStartInterview = async () => {
    // 0. Verify resume is analyzed
    if (!analysisResult) {
      setToastMessage('⚠️ Please upload and analyze your resume first before starting the interview.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    // 1. Verify and deduct 50 credits
    const deduction = deductCredits(MOCK_INTERVIEW_COST, 'Mock AI Interview Simulation');
    if (!deduction.success) {
      setShowInsufficientModal(true);
      return;
    }

    setUserCredits(deduction.newBalance);
    setToastMessage(`🪙 50 Credits used. Remaining Balance: ${deduction.newBalance} credits.`);
    setTimeout(() => setToastMessage(''), 3000);

    const safeQuestions = Array.isArray(questions) && questions.length > 0 ? questions : DEFAULT_QUESTIONS;
    setQuestions(safeQuestions);
    initQuestion(0, safeQuestions);
  };

  // Initialize a specific question (1-5)
  const initQuestion = (index, qList = questions) => {
    const list = Array.isArray(qList) && qList.length > 0
      ? qList
      : (Array.isArray(questions) && questions.length > 0 ? questions : DEFAULT_QUESTIONS);
    const q = list[index] || list[0] || DEFAULT_QUESTIONS[0];
    if (!q) return;

    stopRecording();
    setCurrentQuestionIndex(index);
    setCurrentAnswer('');
    currentAnswerRef.current = '';
    baseTextRef.current = '';
    setHasSubmittedCurrent(false);
    setCurrentFeedback(null);

    // Set time limit: Q1 & Q2: 60s, Q3 & Q4: 90s, Q5: 120s
    const limit = q.timeLimit || (index < 2 ? 60 : index < 4 ? 90 : 120);
    setTotalTimeForCurrent(limit);
    setTimeRemaining(limit);
    setIsTimerRunning(false); // Timer paused while agent speaks question
    setStage('interview');

    // Read aloud question; countdown starts ONLY when agent completes reading
    setTimeout(() => {
      speakText(q.text, () => {
        setIsTimerRunning(true);
      });
    }, 400);
  };

  // Submit Answer for Evaluation
  const handleSubmitAnswer = async () => {
    stopRecording();
    setIsTimerRunning(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    const currentQ = (Array.isArray(questions) && questions[currentQuestionIndex]) || DEFAULT_QUESTIONS[0];
    if (!currentQ) return;
    setIsEvaluatingAnswer(true);

    const answerToSubmit = currentAnswerRef.current !== undefined && currentAnswerRef.current !== ''
      ? currentAnswerRef.current
      : currentAnswer;

    try {
      const rawEval = await evaluateAnswerApi({
        question: currentQ.text,
        answer: answerToSubmit,
        role,
        interviewType
      });

      const evaluation = rawEval?.result || rawEval || {
        score: 7.0,
        feedback: "Good response. Try to structure your points clearly.",
        confidence: 7.0,
        communication: 7.0,
        correctness: 7.0
      };

      setCurrentFeedback(evaluation);
      setHasSubmittedCurrent(true);

      // Agent speaks the feedback aloud
      if (evaluation?.feedback) {
        speakText(evaluation.feedback);
      }

      const resultItem = {
        question: currentQ,
        answer: answerToSubmit,
        evaluation,
        timeSpent: totalTimeForCurrent - (timeRemaining || 0)
      };

      setSessionResults((prev) => {
        const updated = [...prev];
        updated[currentQuestionIndex] = resultItem;
        return updated;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluatingAnswer(false);
    }
  };

  // Advance to Next Question or Final Report
  const handleNextQuestion = async () => {
    if (Array.isArray(questions) && currentQuestionIndex < questions.length - 1) {
      initQuestion(currentQuestionIndex + 1);
    } else {
      // Completed all 5 questions: Generate Final Report
      setIsGeneratingReport(true);
      try {
        const rawReport = await generateInterviewReportApi({
          sessionResults,
          role,
          interviewType
        });

        const finalReport = rawReport?.result || rawReport || {
          overallScore: '7.5',
          performanceVerdict: 'Strong Candidate with Solid Fundamentals',
          improvementTip: 'Continue practicing scenario questions with concrete metric outcomes.',
          trendScores: [6, 7, 7.5, 8, 8.5],
          role: role || 'Software Developer',
          interviewType
        };

        setReportData(finalReport);
        setStage('report');

        // Check for High Performance Reward (Score >= 8.0 -> +25 Credits)
        const scoreNum = parseFloat(finalReport?.overallScore || 0);
        if (scoreNum >= 8.0) {
          const newBal = addCredits(HIGH_SCORE_MOCK_REWARD, `High Mock Interview Score (${scoreNum}/10)`);
          setHighScoreAwarded({
            score: scoreNum,
            amount: HIGH_SCORE_MOCK_REWARD,
            newBalance: newBal
          });
        }

        // Persist to storage
        saveMockReport({
          id: `mock-${Date.now()}`,
          role,
          interviewType,
          overallScore: finalReport?.overallScore || '7.5',
          performanceVerdict: finalReport?.performanceVerdict || 'Good Performance',
          report: finalReport,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsGeneratingReport(false);
      }
    }
  };

  // Retake Interview
  const handleRetakeInterview = () => {
    setSessionResults([]);
    setCurrentQuestionIndex(0);
    setCurrentAnswer('');
    setHasSubmittedCurrent(false);
    setCurrentFeedback(null);
    setReportData(null);
    setHighScoreAwarded(null);
    navigate('/mock-interview', { replace: true });
    setStage('setup');
  };

  // Current Question helper
  const currentQ = (Array.isArray(questions) && questions[currentQuestionIndex]) || DEFAULT_QUESTIONS[0] || {
    id: 1,
    difficulty: 'Easy',
    timeLimit: 60,
    text: 'Loading question...'
  };

  // Question Difficulty helper (Easy: Green/Blue, Medium: Orange/Yellow, Hard: Red)
  const getDifficulty = (q, idx) => {
    if (q?.difficulty) return q.difficulty;
    if (idx < 2) return 'Easy';
    if (idx < 4) return 'Medium';
    return 'Hard';
  };

  const activeDifficulty = getDifficulty(currentQ, currentQuestionIndex);
  const activeDifficultyClass = activeDifficulty.toLowerCase();

  // Timer SVG circumference
  const timerRadius = 38;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerPercent = totalTimeForCurrent > 0 ? timeRemaining / totalTimeForCurrent : 0;
  const timerDashoffset = timerCircumference - timerPercent * timerCircumference;

  // Gauge SVG circumference for Report Screen
  const gaugeScore = reportData?.overallScore ?? 7.5;
  const gaugePercent = Math.min(Math.max(gaugeScore / 10, 0), 1);
  const gaugeRadius = 48;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeDashoffset = gaugeCircumference - gaugePercent * gaugeCircumference;

  return (
    <div className="mock-interview-page">
      {/* ============================================================== */}
      {/* 1. SETUP STAGE (Images 1 & 2)                                 */}
      {/* ============================================================== */}
      {stage === 'setup' && (
        <div className="interview-setup-container">
          {/* Left Hero Card */}
          <div className="setup-hero-card">
            <div className="setup-hero-header">
              <h1>Start Your AI Interview</h1>
              <p>
                Practice real interview scenarios powered by AI. Improve communication, technical skills, and confidence.
              </p>
            </div>

            <div className="setup-features-list">
              <div className="setup-feature-pill">
                <div className="pill-icon-box">
                  <User size={18} />
                </div>
                <span>Choose Role & Experience</span>
              </div>

              <div
                className="setup-feature-pill active-feature"
                onClick={async () => {
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      stream.getTracks().forEach((t) => t.stop());
                      setToastMessage('✅ Microphone permission granted & ready for your interview!');
                      setTimeout(() => setToastMessage(''), 3500);
                    } catch (err) {
                      setToastMessage('⚠️ Microphone permission required. Please allow access in browser address bar.');
                      setTimeout(() => setToastMessage(''), 4000);
                    }
                  } else {
                    setToastMessage('🎙️ Smart Voice Interview is ready for your session.');
                    setTimeout(() => setToastMessage(''), 3000);
                  }
                }}
                title="Click to test your microphone access"
                style={{ cursor: 'pointer' }}
              >
                <div className="pill-icon-box">
                  <Mic size={18} />
                </div>
                <span>Smart Voice Interview (Ready)</span>
              </div>

              <div className="setup-feature-pill">
                <div className="pill-icon-box">
                  <Sparkles size={18} />
                </div>
                <span>Performance Analytics</span>
              </div>

              <div className="setup-feature-pill highlight-credits">
                <div className="pill-icon-box credits-icon-box">
                  <Coins size={18} />
                </div>
                <span>
                  +25 Credits for scoring 8.0+
                </span>
              </div>
            </div>
          </div>

          {/* Right Setup Card */}
          <div className="setup-form-card">
            <h2 className="setup-title">Interview Setup</h2>

            {/* Input 1: Role */}
            <div className="setup-field">
              <div className="setup-input-wrap">
                <User size={16} className="setup-field-icon" />
                <input
                  type="text"
                  placeholder="Enter Role (e.g. Frontend Developer, HR Specialist)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>

            {/* Input 2: Experience */}
            <div className="setup-field">
              <div className="setup-input-wrap">
                <Briefcase size={16} className="setup-field-icon" />
                <input
                  type="text"
                  placeholder="Experience (e.g. 2 years, Fresher)"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>
            </div>

            {/* Input 3: Interview Type Dropdown */}
            <div className="setup-field">
              <select
                className="setup-select"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
              >
                <option value="Technical Interview">Technical Interview</option>
                <option value="HR Interview">HR Interview</option>
              </select>
            </div>

            {/* Resume Setup: Show Upload Field OR Analysis Result (Replaces upload field once analyzed) */}
            {!analysisResult ? (
              <div className="setup-resume-box">
                {savedResumesList.length > 0 && (
                  <div className="setup-workspace-select-row">
                    <span className="ws-label">Or use saved resume:</span>
                    <select
                      className="ws-select"
                      value={selectedResumeId}
                      onChange={handleSelectWorkspaceResume}
                    >
                      <option value="">-- Upload PDF file below --</option>
                      {savedResumesList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title || 'My ATS Resume'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Upload Drop Area */}
                <label className="resume-dropzone">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <div className="dropzone-content">
                    <div className="upload-icon-circle">
                      <Upload size={18} />
                    </div>
                    <span className="file-name-text">
                      {resumeFileName || 'Upload Resume PDF or click to browse'}
                    </span>
                  </div>
                </label>

                <button
                  type="button"
                  className="btn-analyze-resume"
                  onClick={handleAnalyzeResume}
                  disabled={isAnalyzingResume}
                >
                  {isAnalyzingResume ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Analyzing Resume...</span>
                    </>
                  ) : (
                    <span>Analyze Resume</span>
                  )}
                </button>
              </div>
            ) : (
              /* Analysis Result (Projects & Skills) - Replaces the resume insert field */
              <div className="resume-analysis-card">
                <div className="analysis-header-row">
                  <div className="analysis-header">
                    <CheckCircle2 size={16} className="check-icon" />
                    <span>Resume Analysis Result</span>
                  </div>
                  <button
                    type="button"
                    className="btn-change-resume-link"
                    onClick={() => {
                      setAnalysisResult(null);
                      setResumePdfFile(null);
                      setResumeFileName('');
                    }}
                  >
                    Change Resume
                  </button>
                </div>

                {Array.isArray(analysisResult?.projects) && analysisResult.projects.length > 0 && (
                  <div className="analysis-section">
                    <span className="section-label">Projects:</span>
                    <ul className="projects-list">
                      {analysisResult.projects.map((proj, idx) => (
                        <li key={idx}>
                          • {typeof proj === 'string' ? proj : (proj?.name || proj?.title || JSON.stringify(proj))}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(analysisResult?.skills) && analysisResult.skills.length > 0 && (
                  <div className="analysis-section">
                    <span className="section-label">Skills:</span>
                    <div className="skills-badge-wrap">
                      {analysisResult.skills.map((skill, idx) => (
                        <span key={idx} className="skill-badge-mint">
                          {typeof skill === 'string' ? skill : (skill?.name || JSON.stringify(skill))}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Warning if credits < 50 */}
            {userCredits < 50 && (
              <div className="credits-insufficient-banner">
                <AlertCircle size={15} />
                <span>You need 50 credits to start. Complete daily prep tasks in Plan Tracker to earn +15 credits!</span>
              </div>
            )}

            {/* Start Interview CTA Button - only active when resume is analyzed & user has >= 50 credits */}
            {(() => {
              const isResumeAnalyzed = Boolean(analysisResult);
              const hasSufficientCredits = userCredits >= MOCK_INTERVIEW_COST;
              const canStartInterview = isResumeAnalyzed && hasSufficientCredits && !isAnalyzingResume && Boolean(role.trim());

              return (
                <button
                  type="button"
                  className={`btn-start-interview ${!canStartInterview ? 'disabled-btn' : ''} ${userCredits < 50 ? 'insufficient-btn' : ''}`}
                  onClick={handleStartInterview}
                  disabled={!canStartInterview}
                  title={
                    !isResumeAnalyzed
                      ? 'Please analyze your resume before starting the interview'
                      : !hasSufficientCredits
                        ? 'Insufficient credits (50 required)'
                        : !role.trim()
                          ? 'Please enter a target role'
                          : 'Start your AI mock interview'
                  }
                >
                  <span>Start Interview</span>
                  <span className="btn-cost-pill">
                    <Coins size={14} className="cost-coins-icon" />
                    <span>50 Credits</span>
                  </span>
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. LIVE INTERVIEW STAGE (Images 3 & 4)                        */}
      {/* ============================================================== */}
      {stage === 'interview' && (
        <div className="interview-live-container">
          {/* Left Column: Avatar & Status/Timer Card */}
          <div className="interview-left-col">
            {/* 3D Interviewer Avatar */}
            <AvatarInterviewer
              isSpeaking={isSpeaking}
              isMuted={isMuted}
              onToggleMute={() => {
                setIsMuted((m) => !m);
                if (!isMuted && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
              }}
              isRecording={isRecording}
              onToggleMic={toggleRecording}
            />

            {/* Interviewer Status / Feedback Caption Box */}
            <div className="interviewer-caption-card">
              <span className={`caption-pulse-dot ${isRecording ? 'recording' : isSpeaking ? 'speaking' : ''}`} />
              <p>
                {hasSubmittedCurrent && currentFeedback?.feedback
                  ? currentFeedback.feedback
                  : isSpeaking
                    ? "AI Interviewer speaking..."
                    : isRecording
                      ? "Listening to your answer..."
                      : "Ready for your answer"}
              </p>
            </div>

            {/* Status & Circular Timer Card */}
            <div className="interview-status-card">
              <div className="status-top-row">
                <span className="status-label">Interview Status</span>
                <span
                  className={`status-val ${hasSubmittedCurrent
                    ? 'submitted'
                    : isSpeaking
                      ? 'speaking'
                      : isRecording
                        ? 'recording'
                        : 'ready'
                    }`}
                >
                  {hasSubmittedCurrent
                    ? 'Answer Submitted'
                    : isSpeaking
                      ? 'AI Speaking'
                      : isRecording
                        ? 'Listening (Mic Active)'
                        : 'Ready to Answer'}
                </span>
              </div>

              {/* Circular SVG Timer Ring */}
              <div className="timer-ring-wrap">
                <svg className="timer-svg" width="100" height="100">
                  <circle
                    className="timer-bg"
                    cx="50"
                    cy="50"
                    r={timerRadius}
                  />
                  <circle
                    className={`timer-progress ${timeRemaining < 15 ? 'critical' : timeRemaining < 30 ? 'warning' : ''}`}
                    cx="50"
                    cy="50"
                    r={timerRadius}
                    strokeDasharray={timerCircumference}
                    strokeDashoffset={timerDashoffset}
                  />
                </svg>
                <div className="timer-number-box">
                  <span className="timer-seconds">{timeRemaining}s</span>
                </div>
              </div>

              {/* Question Indicators */}
              <div className="status-bottom-row">
                <div className="status-stat">
                  <span className="stat-num">{currentQuestionIndex + 1}</span>
                  <span className="stat-lbl">Current Question</span>
                </div>
                {/* Colored Difficulty Badge: No seconds displayed */}
                <div className={`status-difficulty-badge badge-${activeDifficultyClass}`}>
                  <span className={`diff-dot dot-${activeDifficultyClass}`} />
                  <span>{activeDifficulty}</span>
                </div>
                <div className="status-stat right">
                  <span className="stat-num">{questions?.length || 5}</span>
                  <span className="stat-lbl">Total Questions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Question Box, Textarea, Mic, Submit Action */}
          <div className="interview-right-col">
            <h2 className="interview-right-title">AI Smart Interview</h2>

            {/* Current Question Box with Difficulty Color Coding */}
            <div className={`question-display-card card-diff-${activeDifficultyClass}`}>
              <div className="question-header-row">
                <span className="question-count-tag">
                  Question {currentQuestionIndex + 1} of {questions?.length || 5}
                </span>
                <span className={`question-diff-pill pill-${activeDifficultyClass}`}>
                  <span className={`diff-dot dot-${activeDifficultyClass}`} />
                  <span>{activeDifficulty}</span>
                </span>
              </div>
              <p className="question-text">{currentQ.text}</p>
            </div>

            {/* Answer Textarea with Real-time Voice to Text & Manual Editing */}
            <div className="answer-input-card">
              {isRecording && (
                <div className="mic-live-banner">
                  <span className="live-pulse-dot" />
                  <span>Microphone Active • Words appear below in real-time and can be edited manually anytime.</span>
                </div>
              )}
              <textarea
                rows={5}
                className={`answer-textarea ${isRecording ? 'recording-active' : ''}`}
                placeholder={
                  isRecording
                    ? "Listening... Speak your answer now (you can also edit manually by typing here)..."
                    : "Type your answer here or click the mic button below to answer by voice..."
                }
                value={currentAnswer}
                onChange={(e) => {
                  setCurrentAnswer(e.target.value);
                  currentAnswerRef.current = e.target.value;
                  baseTextRef.current = e.target.value;
                }}
                disabled={hasSubmittedCurrent}
              />
            </div>

            {/* Immediate AI Feedback Box (Image 4) */}
            {hasSubmittedCurrent && currentFeedback && (
              <div className="immediate-feedback-box">
                <div className="feedback-content">
                  <CheckCircle2 size={18} className="feedback-icon" />
                  <p>{currentFeedback.feedback}</p>
                </div>
              </div>
            )}

            {/* Action Bar: Mic Button & Submit / Next Button */}
            <div className="interview-bottom-bar">
              {!hasSubmittedCurrent && (
                <button
                  type="button"
                  className={`btn-mic-circle ${isRecording ? 'recording' : ''}`}
                  onClick={toggleRecording}
                  title={isRecording ? 'Mute Microphone' : 'Turn On Microphone (Speak Answer)'}
                  aria-label={isRecording ? 'Mute Microphone' : 'Turn On Microphone'}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                  {isRecording && <span className="mic-pulse-ring" />}
                </button>
              )}

              {!hasSubmittedCurrent ? (
                <button
                  type="button"
                  className="btn-submit-answer"
                  onClick={handleSubmitAnswer}
                  disabled={isEvaluatingAnswer}
                >
                  {isEvaluatingAnswer ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Evaluating Answer...</span>
                    </>
                  ) : (
                    <span>Submit Answer</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-next-question"
                  onClick={handleNextQuestion}
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Generating Analytics Report...</span>
                    </>
                  ) : currentQuestionIndex < (questions?.length || 5) - 1 ? (
                    <>
                      <span>Next Question</span>
                      <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      <span>Finish & View Analytics Dashboard</span>
                      <Sparkles size={16} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. REPORT STAGE (Image 5)                                     */}
      {/* ============================================================== */}
      {stage === 'report' && reportData && (
        <div className="interview-report-container">
          {/* Header Action Row */}
          <div className="report-header-row">
            <div className="report-title-group">
              <button
                type="button"
                className="btn-back-round"
                onClick={handleRetakeInterview}
                title="Restart Mock Interview"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1>Interview Analytics Dashboard</h1>
                <p>AI-powered performance insights</p>
              </div>
            </div>

            <button
              type="button"
              className="btn-download-report-pdf"
              onClick={() => window.print()}
            >
              <Download size={15} />
              <span>Download PDF</span>
            </button>
          </div>

          {/* High Score Celebration Banner (+25 Credits Reward) */}
          {highScoreAwarded && (
            <div className="report-reward-banner">
              <div className="reward-trophy-badge">🏆</div>
              <div className="reward-info">
                <h4>Outstanding Performance! +25 Credits Earned</h4>
                <p>
                  You scored <strong>{highScoreAwarded.score}/10</strong>! 25 bonus credits have been added to your account (Current Balance: <strong>{highScoreAwarded.newBalance} Credits</strong>).
                </p>
              </div>
            </div>
          )}

          {/* 4-Card Dashboard Grid */}
          <div className="report-grid">
            {/* Card 1: Overall Performance (Top Left) */}
            <div className="report-card overall-performance-card">
              <h3 className="card-heading">Overall Performance</h3>

              {/* Circular Gauge Ring */}
              <div className="gauge-wrap">
                <svg className="gauge-svg" width="130" height="130">
                  <circle
                    className="gauge-bg"
                    cx="65"
                    cy="65"
                    r={gaugeRadius}
                  />
                  <circle
                    className="gauge-progress"
                    cx="65"
                    cy="65"
                    r={gaugeRadius}
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={gaugeDashoffset}
                  />
                </svg>
                <div className="gauge-score-display">
                  <span className="gauge-number">{reportData.overallScore || '7.5'}</span>
                </div>
              </div>

              <span className="out-of-ten-text">Out of 10</span>
              <h4 className="verdict-title">{reportData.performanceVerdict}</h4>
              <p className="verdict-tip">{reportData.improvementTip}</p>
            </div>

            {/* Card 2: Performance Trend Curve (Top Right) - Enlarged & Enhanced */}
            <div className="report-card performance-trend-card">
              <h3 className="card-heading">Performance Trend</h3>

              <div className="trend-chart-wrap">
                {(() => {
                  const rawScores = Array.isArray(reportData?.trendScores) && reportData.trendScores.length > 0
                    ? reportData.trendScores
                    : [6, 7, 7.5, 8, 8.5];
                  const w = 680;
                  const h = 260;
                  const padX = 55;
                  const padY = 32;

                  // Map points
                  const points = rawScores.map((s, i) => {
                    const numScore = parseFloat(s) || 5;
                    const divisor = Math.max(rawScores.length - 1, 1);
                    const x = padX + (i * (w - padX * 2)) / divisor;
                    const y = h - padY - (Math.min(Math.max(numScore, 0), 10) / 10) * (h - padY * 2);
                    return { x, y, score: numScore };
                  });

                  if (!points || points.length === 0) return null;

                  // Build smooth SVG curve
                  let pathD = `M ${points[0].x} ${points[0].y}`;
                  for (let i = 0; i < points.length - 1; i++) {
                    const p0 = points[i];
                    const p1 = points[i + 1];
                    const mx = (p0.x + p1.x) / 2;
                    pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
                  }

                  const areaD = `${pathD} L ${points[points.length - 1].x} ${h - padY} L ${points[0].x} ${h - padY} Z`;

                  const y10 = padY;
                  const y75 = padY + (h - padY * 2) * 0.25;
                  const y50 = padY + (h - padY * 2) * 0.5;
                  const y25 = padY + (h - padY * 2) * 0.75;
                  const y0 = h - padY;

                  return (
                    <svg className="trend-svg" viewBox={`0 0 ${w} ${h}`}>
                      {/* Grid Lines */}
                      <line x1={padX} y1={y10} x2={w - padX} y2={y10} stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1={padX} y1={y75} x2={w - padX} y2={y75} stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1={padX} y1={y50} x2={w - padX} y2={y50} stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1={padX} y1={y25} x2={w - padX} y2={y25} stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1={padX} y1={y0} x2={w - padX} y2={y0} stroke="#cbd5e1" strokeWidth="1.5" />

                      {/* Y-Axis Labels */}
                      <text x={padX - 10} y={y10 + 4} textAnchor="end" className="chart-label">10</text>
                      <text x={padX - 10} y={y75 + 4} textAnchor="end" className="chart-label">7.5</text>
                      <text x={padX - 10} y={y50 + 4} textAnchor="end" className="chart-label">5.0</text>
                      <text x={padX - 10} y={y25 + 4} textAnchor="end" className="chart-label">2.5</text>
                      <text x={padX - 10} y={y0 + 4} textAnchor="end" className="chart-label">0</text>

                      {/* Area Fill */}
                      <path d={areaD} fill="url(#trendGradient)" />

                      {/* Curve Stroke */}
                      <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" />

                      {/* Vertical Drop Lines */}
                      {points.map((pt, i) => (
                        <line
                          key={`drop-${i}`}
                          x1={pt.x}
                          y1={pt.y}
                          x2={pt.x}
                          y2={y0}
                          stroke="#10b981"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          opacity="0.4"
                        />
                      ))}

                      {/* Dots, Floating Badges & X-Labels */}
                      {points.map((pt, i) => (
                        <g key={`pt-${i}`}>
                          {/* Floating Score Badge above point */}
                          <g transform={`translate(${pt.x}, ${Math.max(16, pt.y - 18)})`}>
                            <rect x="-22" y="-11" width="44" height="20" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                            <text x="0" y="3" textAnchor="middle" fill="#065f46" fontSize="11" fontWeight="700">
                              {pt.score}/10
                            </text>
                          </g>

                          {/* Data Point Dot */}
                          <circle cx={pt.x} cy={pt.y} r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />

                          {/* Question Label */}
                          <text x={pt.x} y={h - 10} textAnchor="middle" className="chart-x-label">
                            Q{i + 1}
                          </text>
                        </g>
                      ))}

                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.38" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.03" />
                        </linearGradient>
                      </defs>
                    </svg>
                  );
                })()}
              </div>
            </div>

            {/* Card 3: Skill Evaluation (Bottom Left) */}
            <div className="report-card skill-evaluation-card">
              <h3 className="card-heading">Skill Evaluation</h3>

              <div className="skill-bars-list">
                <div className="skill-bar-row">
                  <div className="skill-info">
                    <span className="skill-name">Confidence</span>
                    <span className="skill-score">{reportData.skillEvaluation?.confidence ?? '7.5'}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${((reportData.skillEvaluation?.confidence ?? 7.5) / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="skill-bar-row">
                  <div className="skill-info">
                    <span className="skill-name">Communication</span>
                    <span className="skill-score">{reportData.skillEvaluation?.communication ?? '7.8'}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${((reportData.skillEvaluation?.communication ?? 7.8) / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="skill-bar-row">
                  <div className="skill-info">
                    <span className="skill-name">Correctness</span>
                    <span className="skill-score">{reportData.skillEvaluation?.correctness ?? '8.0'}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${((reportData.skillEvaluation?.correctness ?? 8.0) / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Question Breakdown (Bottom Right) */}
            <div className="report-card question-breakdown-card">
              <h3 className="card-heading">Question Breakdown</h3>

              <div className="breakdown-cards-list">
                {(reportData.breakdown || []).map((item, idx) => (
                  <div className="breakdown-single-card" key={idx}>
                    <div className="breakdown-card-top">
                      <div className="breakdown-tag-group">
                        <span className="q-tag">Question {item.questionId || idx + 1}</span>
                        {(() => {
                          const diff = getDifficulty(item, idx);
                          const diffClass = diff.toLowerCase();
                          return (
                            <span className={`breakdown-diff-pill pill-${diffClass}`}>
                              <span className={`diff-dot dot-${diffClass}`} />
                              <span>{diff}</span>
                            </span>
                          );
                        })()}
                      </div>
                      <span className="q-score-badge">{item.score || 7} / 10</span>
                    </div>

                    <p className="breakdown-question">{item.questionText}</p>

                    {item.answerText && (
                      <div className="breakdown-candidate-answer">
                        <span className="ans-label">Your Answer:</span>
                        <p>{item.answerText}</p>
                      </div>
                    )}

                    <div className="breakdown-ai-feedback">
                      <span className="ai-feedback-tag">AI Feedback</span>
                      <p>{item.feedback}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="mock-toast">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Insufficient Credits Dialog */}
      {showInsufficientModal && (
        <div className="credits-modal-backdrop" onClick={() => setShowInsufficientModal(false)}>
          <div className="credits-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-coin-badge">
              <Coins size={32} />
            </div>
            <h3>Insufficient Credits</h3>
            <p className="modal-lead">
              You need <strong>50 Credits</strong> to launch a Mock AI Interview. Your current balance is <strong>{userCredits} Credits</strong>.
            </p>

            <div className="modal-ways-list">
              <span className="ways-title">Ways to Earn Credits:</span>
              <div className="way-item">
                <span className="way-badge">+15</span>
                <span>Complete daily study roadmap tasks in <strong>Plan Tracker</strong></span>
              </div>
              <div className="way-item">
                <span className="way-badge">+25</span>
                <span>Score 8.0 or higher in a <strong>Mock AI Interview</strong></span>
              </div>
            </div>

            <div className="modal-btn-row">
              <button
                type="button"
                className="btn-earn-plan"
                onClick={() => {
                  setShowInsufficientModal(false);
                  navigate('/plan-tracker');
                }}
              >
                <Sparkles size={14} />
                <span>Earn in Plan Tracker (+15 Credits)</span>
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowInsufficientModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

