import React, { useEffect, useRef, useState } from 'react';
import { WizardChessScene } from './game/wizardChessScene';
import { soundManager } from './game/soundEffects';
import {
  Volume2,
  VolumeX,
  Camera,
  RotateCcw,
  Sparkles,
  EyeOff,
  Eye,
  Crown,
  Play,
  Users,
  BookOpen,
  Settings as SettingsIcon,
  Home,
  Shield,
  Swords,
  X,
  Check,
  Brain,
  ChevronRight,
  User
} from 'lucide-react';

export default function App() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadPercent, setLoadPercent] = useState(0);
  const [loadStatus, setLoadStatus] = useState('Khởi tạo Thánh đường Phù thủy...');

  // Home Screen and Navigation state
  const [isHomeMenu, setIsHomeMenu] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState('ai'); // 'ai' or 'pass-play'
  const [aiDifficulty, setAiDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Gameplay state
  const [currentTurn, setCurrentTurn] = useState('w');
  const [inCheck, setInCheck] = useState(false);
  const [playerColor, setPlayerColor] = useState('w');
  const [capturedWhite, setCapturedWhite] = useState(0);
  const [capturedBlack, setCapturedBlack] = useState(0);

  const [activeCam, setActiveCam] = useState('player');
  const [uiHidden, setUiHidden] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [cuteSoldiers, setCuteSoldiers] = useState(false);

  const [gameOverModal, setGameOverModal] = useState({
    visible: false,
    type: 'none',
    winner: ''
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new WizardChessScene(containerRef.current, {
      onStateChange: (state) => {
        setCurrentTurn(state.currentTurn);
        setInCheck(state.inCheck);
        setCapturedWhite(state.capturedWhite);
        setCapturedBlack(state.capturedBlack);
      },
      onGameOver: (type, winner) => {
        setGameOverModal({ visible: true, type, winner });
      }
    });

    sceneRef.current = scene;

    scene.loadAssets((percent, text) => {
      setLoadPercent(percent);
      setLoadStatus(text);
      if (percent >= 100) {
        setTimeout(() => {
          setLoading(false);
          // Start in Home Menu with sweeping panoramic camera
          scene.setHomeMenuMode(true);
        }, 500);
      }
    });

    // Keyboard shortcut 'H' to toggle UI
    const handleKeyDown = (e) => {
      if (e.key === 'h' || e.key === 'H') {
        setUiHidden((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (showRulesModal) setShowRulesModal(false);
        else if (showSettingsModal) setShowSettingsModal(false);
        else if (!loading) {
          setIsHomeMenu((prev) => {
            const next = !prev;
            sceneRef.current?.setHomeMenuMode(next);
            return next;
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      scene.destroy();
    };
  }, []);

  // Home Screen actions
  const handleStartGame = (mode = gameMode, color = playerColor, diff = aiDifficulty) => {
    soundManager.playMenuClick();
    setGameMode(mode);
    setPlayerColor(color);
    setAiDifficulty(diff);

    if (sceneRef.current) {
      sceneRef.current.setGameMode(mode);
      sceneRef.current.setAiDifficulty(diff);
      sceneRef.current.setPlayerColor(color);
      sceneRef.current.resetGame();
      sceneRef.current.setHomeMenuMode(false);
    }

    setGameStarted(true);
    setIsHomeMenu(false);
    setGameOverModal({ visible: false, type: 'none', winner: '' });
  };

  const handleResumeGame = () => {
    soundManager.playMenuClick();
    if (sceneRef.current) {
      sceneRef.current.setHomeMenuMode(false);
    }
    setIsHomeMenu(false);
  };

  const handleOpenHomeMenu = () => {
    soundManager.playMenuClick();
    if (sceneRef.current) {
      sceneRef.current.setHomeMenuMode(true);
    }
    setIsHomeMenu(true);
  };

  const handleCameraChange = (type) => {
    soundManager.playMenuClick();
    setActiveCam(type);
    sceneRef.current?.setCameraView(type);
  };

  const handlePlayerColorToggle = () => {
    soundManager.playMenuClick();
    const nextColor = playerColor === 'w' ? 'b' : 'w';
    setPlayerColor(nextColor);
    sceneRef.current?.setPlayerColor(nextColor);
  };

  const handleAIMove = () => {
    soundManager.playMenuClick();
    sceneRef.current?.triggerAIMove();
  };

  const handleNewGame = () => {
    soundManager.playMenuClick();
    setGameOverModal({ visible: false, type: 'none', winner: '' });
    sceneRef.current?.resetGame();
  };

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    soundManager.muted = next;
    if (!next) soundManager.playMenuClick();
  };

  const handleToggleSoldierStyle = () => {
    soundManager.playMenuClick();
    const next = !cuteSoldiers;
    setCuteSoldiers(next);
    sceneRef.current?.setCuteSoldiers(next);
  };

  return (
    <div className={`app-root ${uiHidden ? 'cinematic-ui-hidden' : ''}`}>
      {/* ================= GOTHIC SANCTUM SPLASH SCREEN ================= */}
      <div id="loading-overlay" className={loading ? '' : 'hidden'}>
        {/* Dark Gothic Atmospheric Glow & Vignette */}
        <div className="splash-ambient-glow" />

        {/* 4 Ornate Gothic Corner Brackets */}
        <div className="splash-corner top-left">
          <svg viewBox="0 0 60 60" fill="none">
            <path d="M2 58 L2 14 Q2 2 14 2 L58 2" stroke="rgba(212, 173, 55, 0.45)" strokeWidth="1.5" />
            <path d="M8 52 L8 18 Q8 8 18 8 L52 8" stroke="rgba(212, 173, 55, 0.25)" strokeWidth="1" />
            <circle cx="14" cy="14" r="2.5" fill="#d4ad37" />
          </svg>
        </div>
        <div className="splash-corner top-right">
          <svg viewBox="0 0 60 60" fill="none">
            <path d="M58 58 L58 14 Q58 2 46 2 L2 2" stroke="rgba(212, 173, 55, 0.45)" strokeWidth="1.5" />
            <path d="M52 52 L52 18 Q52 8 42 8 L8 8" stroke="rgba(212, 173, 55, 0.25)" strokeWidth="1" />
            <circle cx="46" cy="14" r="2.5" fill="#d4ad37" />
          </svg>
        </div>
        <div className="splash-corner bottom-left">
          <svg viewBox="0 0 60 60" fill="none">
            <path d="M2 2 L2 46 Q2 58 14 58 L58 58" stroke="rgba(212, 173, 55, 0.45)" strokeWidth="1.5" />
            <path d="M8 8 L8 42 Q8 52 18 52 L52 52" stroke="rgba(212, 173, 55, 0.25)" strokeWidth="1" />
            <circle cx="14" cy="46" r="2.5" fill="#d4ad37" />
          </svg>
        </div>
        <div className="splash-corner bottom-right">
          <svg viewBox="0 0 60 60" fill="none">
            <path d="M58 2 L58 46 Q58 58 46 58 L2 58" stroke="rgba(212, 173, 55, 0.45)" strokeWidth="1.5" />
            <path d="M52 8 L52 42 Q52 52 42 52 L8 52" stroke="rgba(212, 173, 55, 0.25)" strokeWidth="1" />
            <circle cx="46" cy="46" r="2.5" fill="#d4ad37" />
          </svg>
        </div>

        {/* Floating Arcane Embers */}
        <div className="splash-embers-wrap" aria-hidden="true">
          <span className="splash-ember ember-1" />
          <span className="splash-ember ember-2" />
          <span className="splash-ember ember-3" />
          <span className="splash-ember ember-4" />
          <span className="splash-ember ember-5" />
          <span className="splash-ember ember-6" />
        </div>

        {/* Central Gothic Sanctum Astral Seal */}
        <div className="splash-seal-wrap">
          {/* Outer Rotating Astrolabe Ring */}
          <div className="splash-astrolabe-ring">
            <svg viewBox="0 0 160 160" fill="none">
              <circle cx="80" cy="80" r="76" stroke="rgba(212, 173, 55, 0.22)" strokeWidth="1" strokeDasharray="3 6" />
              <circle cx="80" cy="80" r="70" stroke="rgba(212, 173, 55, 0.45)" strokeWidth="1.2" />
              <circle cx="80" cy="80" r="62" stroke="rgba(212, 173, 55, 0.2)" strokeWidth="0.8" strokeDasharray="8 4" />
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <line
                  key={deg}
                  x1="80"
                  y1="8"
                  x2="80"
                  y2={deg % 90 === 0 ? '16' : '12'}
                  stroke="rgba(212, 173, 55, 0.65)"
                  strokeWidth={deg % 90 === 0 ? '1.5' : '1'}
                  transform={`rotate(${deg} 80 80)`}
                />
              ))}
            </svg>
          </div>

          {/* Inner Counter-Rotating Ring */}
          <div className="splash-inner-counter-ring">
            <svg viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="60" r="54" stroke="rgba(212, 173, 55, 0.35)" strokeWidth="1" strokeDasharray="2 4" />
              {[45, 135, 225, 315].map((deg) => (
                <rect
                  key={deg}
                  x="58"
                  y="4"
                  width="4"
                  height="4"
                  fill="rgba(255, 230, 150, 0.7)"
                  transform={`rotate(${deg} 60 60)`}
                />
              ))}
            </svg>
          </div>

          {/* 8-Point Faceted Compass Star Emblem */}
          <div className="splash-compass-star">
            <svg viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="splashStarGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff8db" />
                  <stop offset="50%" stopColor="#ebb834" />
                  <stop offset="100%" stopColor="#9e6e10" />
                </linearGradient>
                <linearGradient id="splashStarGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c89220" />
                  <stop offset="100%" stopColor="#5c3c04" />
                </linearGradient>
              </defs>
              {/* Outer 4 primary rays */}
              <polygon points="50,2 54,44 50,47" fill="url(#splashStarGradLight)" />
              <polygon points="50,2 46,44 50,47" fill="url(#splashStarGradDark)" />
              <polygon points="50,98 54,56 50,53" fill="url(#splashStarGradDark)" />
              <polygon points="50,98 46,56 50,53" fill="url(#splashStarGradLight)" />
              <polygon points="2,50 44,46 47,50" fill="url(#splashStarGradDark)" />
              <polygon points="2,50 44,54 47,50" fill="url(#splashStarGradLight)" />
              <polygon points="98,50 56,46 53,50" fill="url(#splashStarGradLight)" />
              <polygon points="98,50 56,54 53,50" fill="url(#splashStarGradDark)" />
              {/* Diagonal 4 rays */}
              <polygon points="16,16 46,44 43,48" fill="url(#splashStarGradLight)" />
              <polygon points="84,16 54,44 57,48" fill="url(#splashStarGradDark)" />
              <polygon points="16,84 46,56 43,52" fill="url(#splashStarGradDark)" />
              <polygon points="84,84 54,56 57,52" fill="url(#splashStarGradLight)" />
              {/* Center Ring & Brilliant Core */}
              <circle cx="50" cy="50" r="8" fill="none" stroke="#ffe594" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
            </svg>
          </div>
        </div>

        {/* Heraldic Brand Header */}
        <div className="splash-brand-block">
          <div className="splash-pre-tag">✦ SANCTUARIUM MAGORUM ✦</div>
          <h1 className="splash-title">WIZARD</h1>
          <div className="splash-wings">
            <span className="splash-wing-line" />
            <span className="splash-wing-diamond">◆</span>
            <span className="splash-wing-text">CHESS 3D</span>
            <span className="splash-wing-diamond">◆</span>
            <span className="splash-wing-line" />
          </div>
          <div className="splash-edition">GOTHIC SANCTUM EDITION</div>
        </div>

        {/* Progress Bar Container */}
        <div className="splash-progress-card">
          <div className="splash-progress-meta">
            <span className="splash-progress-phase">TIẾN TRÌNH KHỞI TẠO</span>
            <span className="splash-progress-percent">{loadPercent}%</span>
          </div>

          <div className="splash-bar-track">
            <div className="splash-track-cap left" />
            <div className="splash-bar-fill" style={{ width: `${loadPercent}%` }}>
              <div className="splash-bar-shimmer" />
              <div className="splash-bar-spark" />
            </div>
            <div className="splash-track-cap right" />
          </div>

          <div id="loader-text" className="splash-status-text">
            {loadStatus}
          </div>
        </div>

        {/* Bottom Lore & Wisdom */}
        <div className="splash-bottom-lore">
          ✦ Một bàn cờ. Hai pháp sư. Một trận chiến định đoạt vương quyền. ✦
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div id="canvas-container" ref={containerRef} />

      {/* ================= GOTHIC SANCTUM CONCEPT HOME SCREEN ================= */}
      {isHomeMenu && !loading && (
        <div className="gothic-home-overlay">
          {/* Subtle atmospheric vignette behind left menu */}
          <div className="gothic-vignette-left" />

          {/* Top Right Gear Button */}
          <button
            type="button"
            className="gothic-top-right-gear"
            onClick={() => {
              soundManager.playMenuClick();
              setShowSettingsModal(true);
            }}
            title="Cài đặt trò chơi"
          >
            <SettingsIcon size={19} />
          </button>

          {/* Bottom Right Profile Badge */}
          <div className="gothic-bottom-right-profile">
            <User size={15} />
            <span>Khách</span>
            <ChevronRight size={14} className="profile-chevron" />
          </div>

          {/* Left-Aligned Floating Menu Column */}
          <div className="gothic-menu-column">
            {/* Header Brand */}
            <div className="gothic-brand-header">
              {/* 8-point gold compass star emblem */}
              <div className="gothic-compass-star">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="starGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fff6d1" />
                      <stop offset="50%" stopColor="#ebb834" />
                      <stop offset="100%" stopColor="#9e6e10" />
                    </linearGradient>
                    <linearGradient id="starGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c89220" />
                      <stop offset="100%" stopColor="#694606" />
                    </linearGradient>
                  </defs>
                  {/* Outer 4 primary rays */}
                  <polygon points="50,2 54,44 50,47" fill="url(#starGradLight)" />
                  <polygon points="50,2 46,44 50,47" fill="url(#starGradDark)" />
                  <polygon points="50,98 54,56 50,53" fill="url(#starGradDark)" />
                  <polygon points="50,98 46,56 50,53" fill="url(#starGradLight)" />
                  <polygon points="2,50 44,46 47,50" fill="url(#starGradDark)" />
                  <polygon points="2,50 44,54 47,50" fill="url(#starGradLight)" />
                  <polygon points="98,50 56,46 53,50" fill="url(#starGradLight)" />
                  <polygon points="98,50 56,54 53,50" fill="url(#starGradDark)" />
                  {/* Diagonal 4 rays */}
                  <polygon points="16,16 46,44 43,48" fill="url(#starGradLight)" />
                  <polygon points="84,16 54,44 57,48" fill="url(#starGradDark)" />
                  <polygon points="16,84 46,56 43,52" fill="url(#starGradDark)" />
                  <polygon points="84,84 54,56 57,52" fill="url(#starGradLight)" />
                  {/* Center ring and crystal */}
                  <circle cx="50" cy="50" r="7.5" fill="none" stroke="#ffe594" strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="3" fill="#ffffff" />
                </svg>
              </div>

              {/* Title Typography */}
              <h1 className="gothic-logo-title">WIZARD</h1>
              <div className="gothic-logo-wings">
                <span className="wing-line" />
                <span className="wing-diamond">◆</span>
                <span className="wing-text">CHESS 3D</span>
                <span className="wing-diamond">◆</span>
                <span className="wing-line" />
              </div>
              <div className="gothic-logo-sub">
                <span>GOTHIC SANCTUM EDITION</span>
                <div className="sub-diamond">◆</div>
              </div>
            </div>

            {/* Primary Action Button (Refined Antique Brass / Brushed Gold Rectangular) */}
            <button
              type="button"
              className="gothic-primary-btn"
              onClick={() => handleStartGame(gameMode, playerColor, aiDifficulty)}
              onMouseEnter={() => soundManager.playMenuHover()}
            >
              <Play size={14} className="primary-btn-icon" />
              <span className="primary-btn-text">
                {gameStarted ? 'TIẾP TỤC TRẬN ĐẤU' : 'BẮT ĐẦU TRẬN ĐẤU'}
              </span>
            </button>

            {/* Mode Selectors List */}
            <div className="gothic-mode-group">
              {/* Option 1: Single Player vs AI */}
              <div className={`mode-card-wrapper ${gameMode === 'ai' ? 'active' : ''} ${gameMode === 'ai' && aiSettingsOpen ? 'has-drawer-open' : ''}`}>
                <button
                  type="button"
                  className="gothic-mode-btn"
                  onClick={() => {
                    soundManager.playMenuClick();
                    setGameMode('ai');
                    setAiSettingsOpen((prev) => (gameMode === 'ai' ? !prev : true));
                  }}
                  onMouseEnter={() => soundManager.playMenuHover()}
                >
                  <div className="mode-btn-left">
                    <Brain size={18} strokeWidth={1.75} className="mode-btn-icon" />
                    <span className="mode-btn-title">Đấu với AI</span>
                  </div>
                  <ChevronRight
                    size={15}
                    strokeWidth={1.75}
                    className={`mode-btn-chevron ${aiSettingsOpen && gameMode === 'ai' ? 'rotated' : ''}`}
                  />
                </button>

                {/* Sub-selector for AI settings (Phe & Độ khó) */}
                {gameMode === 'ai' && aiSettingsOpen && (
                  <div className="mode-drawer">
                    <div className="drawer-group">
                      <span className="drawer-label">Chọn phe:</span>
                      <div className="drawer-pills">
                        <button
                          type="button"
                          className={`drawer-pill ${playerColor === 'w' ? 'selected' : ''}`}
                          onClick={() => {
                            soundManager.playMenuClick();
                            setPlayerColor('w');
                          }}
                        >
                          ⚪ Trắng
                        </button>
                        <button
                          type="button"
                          className={`drawer-pill ${playerColor === 'b' ? 'selected' : ''}`}
                          onClick={() => {
                            soundManager.playMenuClick();
                            setPlayerColor('b');
                          }}
                        >
                          ⚫ Đen
                        </button>
                      </div>
                    </div>

                    <div className="drawer-group">
                      <span className="drawer-label">Mức độ:</span>
                      <div className="drawer-pills">
                        <button
                          type="button"
                          className={`drawer-pill ${aiDifficulty === 'easy' ? 'selected' : ''}`}
                          onClick={() => {
                            soundManager.playMenuClick();
                            setAiDifficulty('easy');
                          }}
                        >
                          Tập Sự
                        </button>
                        <button
                          type="button"
                          className={`drawer-pill ${aiDifficulty === 'medium' ? 'selected' : ''}`}
                          onClick={() => {
                            soundManager.playMenuClick();
                            setAiDifficulty('medium');
                          }}
                        >
                          Pháp Sư
                        </button>
                        <button
                          type="button"
                          className={`drawer-pill ${aiDifficulty === 'hard' ? 'selected' : ''}`}
                          onClick={() => {
                            soundManager.playMenuClick();
                            setAiDifficulty('hard');
                          }}
                        >
                          Đại Sư
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: 2 Players Pass & Play */}
              <div className={`mode-card-wrapper ${gameMode === 'pass-play' ? 'active' : ''}`}>
                <button
                  type="button"
                  className="gothic-mode-btn"
                  onClick={() => {
                    soundManager.playMenuClick();
                    setGameMode('pass-play');
                    setAiSettingsOpen(false);
                  }}
                  onMouseEnter={() => soundManager.playMenuHover()}
                >
                  <div className="mode-btn-left">
                    <Users size={18} strokeWidth={1.75} className="mode-btn-icon" />
                    <span className="mode-btn-title">Hai người chơi</span>
                  </div>
                  <ChevronRight size={15} strokeWidth={1.75} className="mode-btn-chevron" />
                </button>
              </div>
            </div>

            {/* Quick Actions 3-Column Bar */}
            <div className="gothic-utility-bar">
              <button
                type="button"
                className="gothic-utility-btn"
                onClick={() => {
                  soundManager.playMenuClick();
                  setShowRulesModal(true);
                }}
                onMouseEnter={() => soundManager.playMenuHover()}
                title="Luật chơi cờ"
              >
                <BookOpen size={17} strokeWidth={1.75} className="utility-icon" />
                <span className="utility-label">Luật chơi</span>
              </button>

              <button
                type="button"
                className="gothic-utility-btn"
                onClick={() => {
                  soundManager.playMenuClick();
                  setShowSettingsModal(true);
                }}
                onMouseEnter={() => soundManager.playMenuHover()}
                title="Tùy chỉnh hệ thống"
              >
                <SettingsIcon size={17} strokeWidth={1.75} className="utility-icon" />
                <span className="utility-label">Tùy chỉnh</span>
              </button>

              <button
                type="button"
                className="gothic-utility-btn"
                onClick={toggleSound}
                onMouseEnter={() => soundManager.playMenuHover()}
                title={soundMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              >
                {soundMuted ? (
                  <VolumeX size={17} strokeWidth={1.75} className="utility-icon muted" />
                ) : (
                  <Volume2 size={17} strokeWidth={1.75} className="utility-icon" />
                )}
                <span className="utility-label">Âm thanh</span>
              </button>
            </div>

            {/* Tagline footer */}
            <div className="gothic-bottom-motto">
              <span className="motto-star">✦</span>
              <span className="motto-text">Một bàn cờ. Hai pháp sư. Một trận chiến trí tuệ.</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= RULES MODAL ================= */}
      {showRulesModal && (
        <div className="app-modal-backdrop" onClick={() => setShowRulesModal(false)}>
          <div className="app-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <BookOpen size={20} color="#d4ad37" />
                <h3>Hướng Dẫn &amp; Luật Chơi Wizard Chess</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowRulesModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-content">
              <div className="rules-section">
                <h4>⚔️ Cơ Chế Tác Chiến Phù Thủy:</h4>
                <ul>
                  <li><strong>Cách đi quân:</strong> Nhấp vào quân cờ của bạn để hiển thị các nước đi hợp lệ (chấm xanh lá cho ô trống, vòng đỏ cho ô bắt quân).</li>
                  <li><strong>Chiến đấu 3 giai đoạn:</strong> Quân tấn công sẽ tiếp cận dừng ở ô bên cạnh &rarr; tung cú đá vật lý chạm vào đối phương kèm sóng xung kích kim quang &rarr; đá quân cờ văng vừa đủ ra rìa bàn cờ &rarr; bước vào chiếm giữ vị trí.</li>
                  <li><strong>Bảo tồn hiện trạng:</strong> Quân bị đá văng sẽ nằm yên nghỉ tại sàn thánh đường bên ngoài bàn cờ, không biến mất.</li>
                </ul>
              </div>

              <div className="rules-section">
                <h4>🎮 Thao Tác &amp; Phím Tắt:</h4>
                <ul>
                  <li><strong>Xoay bàn cờ 360&deg;:</strong> Giữ chuột trái (hoặc kéo tay) để xoay camera xung quanh tế đàn.</li>
                  <li><strong>Phóng to / Thu nhỏ:</strong> Cuộn con lăn chuột hoặc chụm mở 2 ngón tay trên màn hình cảm ứng.</li>
                  <li><strong>Phím [ H ]:</strong> Ẩn / hiện giao diện điều khiển (HUD) để chiêm ngưỡng không gian điện thờ điện ảnh.</li>
                  <li><strong>Phím [ ESC ]:</strong> Mở menu chính hoặc đóng các cửa sổ tùy chỉnh.</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="home-btn-primary"
                onClick={() => setShowRulesModal(false)}
              >
                ĐÃ HIỂU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SETTINGS MODAL ================= */}
      {showSettingsModal && (
        <div className="app-modal-backdrop" onClick={() => setShowSettingsModal(false)}>
          <div className="app-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <SettingsIcon size={20} color="#d4ad37" />
                <h3>Cài Đặt Trò Chơi</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowSettingsModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-content">
              <div className="settings-row">
                <div>
                  <div className="settings-label">Âm Thanh Hiệu Ứng (SFX)</div>
                  <div className="settings-desc">Âm thanh di chuyển, va chạm vật lý, tiếng chiêu thức</div>
                </div>
                <button
                  type="button"
                  className={`hud-btn ${!soundMuted ? 'active' : ''}`}
                  onClick={toggleSound}
                >
                  {soundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  <span>{soundMuted ? 'Đang Tắt' : 'Đang Bật'}</span>
                </button>
              </div>

              <div className="settings-row">
                <div>
                  <div className="settings-label">Phong Cách Quân Cờ</div>
                  <div className="settings-desc">Chuyển đổi giữa tượng Gothic cổ điển và quân Chibi đáng yêu</div>
                </div>
                <button
                  type="button"
                  className={`hud-btn ${cuteSoldiers ? 'active' : ''}`}
                  onClick={handleToggleSoldierStyle}
                >
                  {cuteSoldiers ? '✨ Chibi Đáng Yêu' : '🗿 Tượng Đá Gothic'}
                </button>
              </div>

              <div className="settings-row">
                <div>
                  <div className="settings-label">Góc Camera Mặc Định</div>
                  <div className="settings-desc">Chọn góc máy ưa thích để quan sát trận đấu</div>
                </div>
                <div className="cam-quick-group">
                  <button
                    type="button"
                    className={`hud-btn ${activeCam === 'player' ? 'active' : ''}`}
                    onClick={() => handleCameraChange('player')}
                  >
                    Người Chơi
                  </button>
                  <button
                    type="button"
                    className={`hud-btn ${activeCam === 'top' ? 'active' : ''}`}
                    onClick={() => handleCameraChange('top')}
                  >
                    Trên Cao
                  </button>
                  <button
                    type="button"
                    className={`hud-btn ${activeCam === 'side' ? 'active' : ''}`}
                    onClick={() => handleCameraChange('side')}
                  >
                    Nghiêng
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="home-btn-primary"
                onClick={() => setShowSettingsModal(false)}
              >
                LƯU &amp; ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Restore UI button */}
      <button
        type="button"
        className="hud-btn mobile-only-restore-ui"
        onClick={() => setUiHidden(false)}
        title="Hiển thị thanh điều khiển"
      >
        <Eye size={14} /> Hiện Menu
      </button>

      {/* ================= IN-GAME HUD HEADER ================= */}
      {!isHomeMenu && (
        <div id="hud-top">
          <div className="hud-group">
            {/* Home Menu Button */}
            <button
              className="hud-btn home-menu-btn"
              onClick={handleOpenHomeMenu}
              title="Về Màn Hình Chính (Home Menu)"
            >
              <Home size={15} />
              <span>Trang Chủ</span>
            </button>

            <div className="brand-pill">
              <span className="brand-title">Wizard Chess</span>
              <span className="brand-badge">Sanctum 3D</span>
            </div>

            <div className="status-pill">
              <span className={`turn-dot ${currentTurn === 'b' ? 'black' : ''}`} />
              <span>
                {inCheck ? (
                  <strong style={{ color: '#e63946' }}>Chiếu Tướng! </strong>
                ) : null}
                Lượt {currentTurn === 'w' ? 'Quân Trắng' : 'Quân Đen'}
              </span>
              <span className="mode-badge">
                {gameMode === 'pass-play'
                  ? 'Đấu Đôi'
                  : currentTurn === playerColor
                  ? 'Lượt Của Bạn'
                  : 'AI Đang Tính...'}
              </span>
            </div>
          </div>

          <div className="hud-group">
            {/* Game Actions */}
            <button
              className={`hud-btn ${cuteSoldiers ? 'active' : ''}`}
              onClick={handleToggleSoldierStyle}
              title="Chuyển đổi phong cách: Quân Cờ Chibi / Tượng Đá Cổ Điển"
            >
              {cuteSoldiers ? '✨ Chibi' : '🗿 Cổ Điển'}
            </button>

            {gameMode === 'ai' && (
              <button
                className="hud-btn"
                onClick={handlePlayerColorToggle}
                title="Đổi phe giữa Trắng và Đen"
              >
                Đổi Phe ({playerColor === 'w' ? 'Đen' : 'Trắng'})
              </button>
            )}

            {gameMode === 'ai' && (
              <button
                className="hud-btn"
                onClick={handleAIMove}
                title="Yêu cầu AI lập tức đi nước tiếp theo"
              >
                <Sparkles size={14} /> Đi Hộ (AI)
              </button>
            )}

            <button
              className="hud-btn"
              onClick={handleNewGame}
              title="Khởi tạo lại ván đấu mới"
            >
              <RotateCcw size={14} /> Ván Mới
            </button>

            <div className="hud-divider" />

            {/* Camera Controls */}
            <button
              className={`hud-btn ${activeCam === 'player' ? 'active' : ''}`}
              onClick={() => handleCameraChange('player')}
              title="Góc nhìn người chơi"
            >
              <Camera size={14} /> Player
            </button>

            <button
              className={`hud-btn ${activeCam === 'top' ? 'active' : ''}`}
              onClick={() => handleCameraChange('top')}
              title="Góc nhìn từ trên cao thẳng xuống"
            >
              Top
            </button>

            <button
              className={`hud-btn ${activeCam === 'side' ? 'active' : ''}`}
              onClick={() => handleCameraChange('side')}
              title="Góc nhìn bên sườn"
            >
              Side
            </button>

            <button
              className={`hud-btn ${activeCam === 'wide' ? 'active' : ''}`}
              onClick={() => handleCameraChange('wide')}
              title="Toàn cảnh thánh đường"
            >
              Sanctum
            </button>

            <div className="hud-divider" />

            {/* Audio toggle */}
            <button
              className="hud-btn"
              onClick={toggleSound}
              title={soundMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {soundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {/* Hide UI toggle */}
            <button
              className="hud-btn"
              onClick={() => setUiHidden(true)}
              title="Ẩn giao diện để ngắm cảnh [H]"
            >
              <EyeOff size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ================= IN-GAME HUD BOTTOM ================= */}
      {!isHomeMenu && (
        <div id="hud-bottom">
          <div className="hint-pill">
            <span>
              Nhấp quân để <strong>xem nước đi</strong> &bull; Kéo chuột để <strong>xoay 360&deg;</strong> &bull; Cuộn chuột để <strong>phóng to/thu nhỏ</strong>
            </span>
          </div>

          <div className="captured-wrap">
            <div className="captured-pill">
              <span>Quân Trắng bắt:</span>
              <span className="captured-count">{capturedWhite}</span>
            </div>
            <div className="captured-pill">
              <span>Quân Đen bắt:</span>
              <span className="captured-count">{capturedBlack}</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= CHECKMATE VICTORY MODAL ================= */}
      <div
        id="checkmate-overlay"
        className={gameOverModal.visible ? 'visible' : ''}
      >
        <div className="checkmate-banner">
          <div className="checkmate-crown">
            <Crown size={48} color="#d4ad37" />
          </div>
          <div className="checkmate-title">
            {gameOverModal.type === 'checkmate' ? 'CHIẾU BÍ' : 'HÒA CỜ'}
          </div>
          <div className="checkmate-rule" />
          <div className="checkmate-subtitle">
            {gameOverModal.type === 'checkmate'
              ? `Phe ${gameOverModal.winner === 'White' ? 'Trắng' : 'Đen'} Đại Thắng Trên Tế Đàn Thánh Đường!`
              : 'Trận chiến kết thúc với kết quả hòa danh dự.'}
          </div>
          <div className="checkmate-actions">
            <button className="checkmate-btn" onClick={handleNewGame}>
              Đấu Lại
            </button>
            <button
              className="checkmate-btn secondary"
              onClick={() => setGameOverModal((m) => ({ ...m, visible: false }))}
            >
              Quan Sát Bàn Cờ
            </button>
            <button
              className="checkmate-btn secondary"
              onClick={handleOpenHomeMenu}
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
