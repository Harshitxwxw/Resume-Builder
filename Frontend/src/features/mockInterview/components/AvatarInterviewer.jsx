import React from 'react';
import { Volume2, VolumeX, Sparkles, Mic, MicOff } from 'lucide-react';

/**
 * AvatarInterviewer Component
 * Visual 3D-styled interviewer card matching the design in user photos.
 * Features live audio wave indicators when AI is speaking.
 */
export default function AvatarInterviewer({
  isSpeaking = false,
  isMuted = false,
  onToggleMute,
  isRecording = false,
  onToggleMic
}) {
  return (
    <div className={`avatar-interviewer-card ${isSpeaking ? 'speaking' : ''}`}>
      {/* Background Room & Desk Setup */}
      <div className="avatar-canvas-wrap">
        <svg
          viewBox="0 0 400 240"
          className="avatar-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Office Background Gradient */}
            <linearGradient id="officeBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="60%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Window Glow */}
            <linearGradient id="windowGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.4" />
            </linearGradient>

            {/* Hair Gradient */}
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5c3826" />
              <stop offset="100%" stopColor="#3d2314" />
            </linearGradient>

            {/* Yellow Shirt Gradient */}
            <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>

            {/* Skin Tone Gradient */}
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#fdba74" />
            </linearGradient>

            {/* Laptop Metallic */}
            <linearGradient id="laptopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Wall & Window in Background */}
          <rect width="400" height="240" fill="url(#officeBg)" />
          {/* Office whiteboard / notice board on left */}
          <rect x="25" y="20" width="75" height="110" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="35" y="32" width="22" height="18" fill="#fef08a" rx="2" />
          <rect x="62" y="32" width="26" height="18" fill="#bae6fd" rx="2" />
          <rect x="35" y="55" width="45" height="4" rx="1" fill="#94a3b8" />
          <rect x="35" y="64" width="38" height="4" rx="1" fill="#cbd5e1" />
          <rect x="35" y="73" width="42" height="4" rx="1" fill="#cbd5e1" />

          {/* Background Window / Room divider on right */}
          <rect x="280" y="15" width="105" height="135" rx="3" fill="url(#windowGlow)" stroke="#94a3b8" strokeWidth="2" />
          <line x1="332" y1="15" x2="332" y2="150" stroke="#94a3b8" strokeWidth="2" />
          <line x1="280" y1="80" x2="385" y2="80" stroke="#94a3b8" strokeWidth="2" />

          {/* Office Desk */}
          <rect x="0" y="180" width="400" height="60" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
          <line x1="0" y1="180" x2="400" y2="180" stroke="#cbd5e1" strokeWidth="3" />

          {/* Chair Backrest */}
          <rect x="150" y="80" width="100" height="105" rx="18" fill="#334155" />

          {/* Candidate / Interviewer Character Body */}
          {/* Yellow Collared Shirt */}
          <path
            d="M 145 200 L 160 145 L 200 135 L 240 145 L 255 200 Z"
            fill="url(#shirtGrad)"
          />
          {/* Collar Details */}
          <polygon points="185,138 200,162 178,146" fill="#eab308" />
          <polygon points="215,138 200,162 222,146" fill="#ca8a04" />

          {/* Neck */}
          <rect x="190" y="120" width="20" height="24" rx="4" fill="url(#skinGrad)" />

          {/* Hair Back */}
          <path
            d="M 160 85 C 160 45, 240 45, 240 85 C 248 100, 246 140, 238 150 C 230 135, 230 110, 230 110 C 210 110, 190 110, 170 110 C 170 110, 170 135, 162 150 C 154 140, 152 100, 160 85 Z"
            fill="url(#hairGrad)"
          />

          {/* Head & Face */}
          <ellipse cx="200" cy="88" rx="28" ry="32" fill="url(#skinGrad)" />

          {/* Hair Front Styling */}
          <path
            d="M 172 75 C 185 55, 220 52, 230 72 C 224 66, 210 64, 198 68 C 188 72, 178 74, 172 75 Z"
            fill="url(#hairGrad)"
          />
          <path
            d="M 170 82 C 168 115, 172 135, 176 140 C 174 125, 175 105, 177 90 Z"
            fill="url(#hairGrad)"
          />
          <path
            d="M 230 82 C 232 115, 228 135, 224 140 C 226 125, 225 105, 223 90 Z"
            fill="url(#hairGrad)"
          />

          {/* Eyebrows */}
          <path d="M 183 75 Q 190 73 194 76" stroke="#3d2314" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M 206 76 Q 210 73 217 75" stroke="#3d2314" strokeWidth="1.8" fill="none" strokeLinecap="round" />

          {/* Eyes */}
          <ellipse cx="189" cy="85" rx="3.5" ry="4" fill="#3d2314" />
          <circle cx="188" cy="83.5" r="1.2" fill="#ffffff" />
          <ellipse cx="211" cy="85" rx="3.5" ry="4" fill="#3d2314" />
          <circle cx="210" cy="83.5" r="1.2" fill="#ffffff" />

          {/* Nose */}
          <path d="M 200 87 Q 202 94 198 96" stroke="#ea580c" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />

          {/* Mouth (animated open when speaking) */}
          {isSpeaking ? (
            <ellipse cx="200" cy="104" rx="5" ry="3.5" fill="#be123c" />
          ) : (
            <path d="M 194 103 Q 200 108 206 103" stroke="#be123c" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}

          {/* Cheeks Blush */}
          <circle cx="180" cy="94" r="5" fill="#fb7185" opacity="0.25" />
          <circle cx="220" cy="94" r="5" fill="#fb7185" opacity="0.25" />

          {/* Laptop on desk in foreground */}
          <path
            d="M 175 198 L 185 160 L 255 160 L 265 198 Z"
            fill="url(#laptopGrad)"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Laptop Screen glow */}
          <polygon points="188,163 252,163 260,194 180,194" fill="#e0f2fe" opacity="0.8" />
          {/* Apple / Logo dot on laptop back (if facing away) or keyboard front */}
          <ellipse cx="220" cy="178" rx="4" ry="4" fill="#ffffff" opacity="0.9" />

          {/* Coffee Mug on Desk */}
          <rect x="80" y="165" width="16" height="20" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M 96 170 Q 102 175 96 180" stroke="#cbd5e1" strokeWidth="2" fill="none" />
          <line x1="84" y1="168" x2="92" y2="168" stroke="#ca8a04" strokeWidth="1.5" />
        </svg>

        {/* Live Audio Waves Overlay when speaking */}
        {isSpeaking && (
          <div className="avatar-audio-waves" title="AI is speaking">
            <span className="wave-bar bar-1" />
            <span className="wave-bar bar-2" />
            <span className="wave-bar bar-3" />
            <span className="wave-bar bar-4" />
            <span className="wave-bar bar-5" />
          </div>
        )}

        {/* Live Badge in Top Corner */}
        <div className="avatar-live-badge">
          <span className="live-dot" />
          <span>{isSpeaking ? 'AI Speaking' : 'Live Interviewer'}</span>
        </div>

        {/* Controls: Mute AI Speaker & Toggle Candidate Mic */}
        <div className="avatar-top-controls">
          {onToggleMute && (
            <button
              type="button"
              className={`avatar-ctrl-btn ${isMuted ? 'muted' : ''}`}
              onClick={onToggleMute}
              title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          )}

          {onToggleMic && (
            <button
              type="button"
              className={`avatar-ctrl-btn mic-btn ${isRecording ? 'recording' : ''}`}
              onClick={onToggleMic}
              title={isRecording ? 'Mute Microphone' : 'Turn On Microphone (Speak Answer)'}
            >
              {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

