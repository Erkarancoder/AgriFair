import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  X, 
  Sparkles, 
  Mic, 
  ChevronUp, 
  ChevronDown,
  Radio
} from 'lucide-react';
import voiceGuideService from '../../services/voiceGuide.service';

export default function VoiceGuideHUD() {
  const [state, setState] = useState(() => voiceGuideService.getState());
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = voiceGuideService.subscribe((newState) => {
      setState(newState);
      if (newState.currentText) {
        setIsCardVisible(true);
      }
    });
    return unsubscribe;
  }, []);

  const handleToggleMute = (e) => {
    e.stopPropagation();
    voiceGuideService.toggleMute();
  };

  const handleReplay = (e) => {
    e.stopPropagation();
    voiceGuideService.replay();
  };

  const handleDismissCard = (e) => {
    e.stopPropagation();
    voiceGuideService.stop();
    setIsCardVisible(false);
  };

  const handlePillClick = () => {
    if (state.isMuted) {
      voiceGuideService.toggleMute();
      voiceGuideService.speak({
        hindiText: 'नमस्ते किसान भाई! बोलता सहायक चालू हो गया है। आप स्क्रीन पर जहाँ भी क्लिक करेंगे, मैं आपको बोलकर समझाऊंगा।',
        romanText: 'Namaste kisan bhai! Bolta Sahayak chalu ho gaya hai. Aap screen par jahan bhi click karenge, mai bolkar samjhaunga.',
        key: 'welcome-pill-intro',
        force: true
      });
    } else if (!state.lastSpokenText) {
      voiceGuideService.speak({
        hindiText: 'नमस्ते किसान भाई! एग्रीफेयर में आपका स्वागत है। आप स्क्रीन पर जहाँ भी क्लिक करेंगे, मैं आपको बोलकर समझाऊंगा।',
        romanText: 'Namaste kisan bhai! AgriFair me aapka swagat hai. Screen par jahan bhi click karenge, mai bolkar samjhaunga.',
        key: 'welcome-pill-intro',
        force: true
      });
    } else {
      setIsCardVisible(true);
      setIsMinimized(false);
      voiceGuideService.replay();
    }
  };

  return (
    <>
      {/* 1. Floating Voice Guidance Subtitle Card (Bottom Center / Left) */}
      {isCardVisible && state.currentText && !isMinimized && (
        <div 
          role="region"
          aria-label="Kisan Voice Assistant HUD"
          className="fixed bottom-20 left-4 sm:left-6 z-40 max-w-[92vw] sm:max-w-[460px] bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/40 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/40">
                <Mic className="w-4 h-4" />
                {state.isSpeaking && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-400 tracking-wide">
                  बोलता सहायक (AI Voice Guide)
                </span>
                {state.isSpeaking ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    बोल रहा है...
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                    सहायक तैयार
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* Replay */}
              <button
                type="button"
                onClick={handleReplay}
                title="फिर से सुनें (Replay voice)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Mute/Unmute */}
              <button
                type="button"
                onClick={handleToggleMute}
                title={state.isMuted ? 'आवाज़ चालू करें' : 'आवाज़ बंद करें'}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {state.isMuted ? (
                  <VolumeX className="w-4 h-4 text-amber-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>

              {/* Dismiss */}
              <button
                type="button"
                onClick={handleDismissCard}
                title="हटाएं"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hindi Spoken Text (Large, Readable for Farmers) */}
          <div className="space-y-1.5">
            <p className="text-sm sm:text-base font-semibold text-white leading-snug">
              {state.currentText}
            </p>
            {state.currentRoman && (
              <p className="text-xs text-slate-400 leading-normal font-sans italic">
                "{state.currentRoman}"
              </p>
            )}
          </div>

          {/* Audio Equalizer Bars when speaking */}
          {state.isSpeaking && (
            <div className="flex items-center gap-1 mt-3 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-medium text-emerald-300 mr-1.5">आवाज़ चालू:</span>
              <div className="flex items-end gap-1 h-3.5">
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-3" />
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.4s_ease-in-out_infinite_0.1s] h-2" />
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.2s] h-3.5" />
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.4s_ease-in-out_infinite_0.3s] h-2" />
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.7s_ease-in-out_infinite_0.15s] h-3" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Persistent Bottom Pill (Always visible across all pages) */}
      <div className="fixed bottom-6 left-4 sm:left-6 z-40">
        <button
          type="button"
          onClick={handlePillClick}
          aria-label="Toggle Kisan Voice Guide"
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-lg border text-xs font-bold transition-all duration-200 ${
            state.isMuted
              ? 'bg-slate-900/90 text-amber-300 border-amber-500/40 hover:bg-slate-900'
              : state.isSpeaking
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400 shadow-emerald-900/30 scale-105'
              : 'bg-white text-stone-800 border-emerald-500/50 hover:bg-emerald-50 shadow-md'
          }`}
        >
          <div className="relative">
            {state.isMuted ? (
              <VolumeX className="w-4 h-4 text-amber-400" />
            ) : (
              <Mic className="w-4 h-4 text-emerald-600 animate-pulse" />
            )}
            {state.isSpeaking && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            )}
          </div>

          <span className="tracking-wide">
            {state.isMuted
              ? 'बोलता सहायक: आवाज़ बंद है'
              : state.isSpeaking
              ? 'बोलता सहायक: समझा रहा है...'
              : '🎙️ किसान बोलता सहायक'}
          </span>

          {/* Quick Mute Toggle Pill icon */}
          <span 
            onClick={handleToggleMute}
            className="ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors"
            title={state.isMuted ? 'चालू करें' : 'बंद करें'}
          >
            {state.isMuted ? (
              <span className="text-[10px] text-amber-400 font-extrabold uppercase">OFF</span>
            ) : (
              <span className="text-[10px] text-emerald-700 font-extrabold uppercase bg-emerald-100 px-1 rounded">ON</span>
            )}
          </span>
        </button>
      </div>
    </>
  );
}

