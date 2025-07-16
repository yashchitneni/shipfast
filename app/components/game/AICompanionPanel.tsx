'use client';

import React, { useEffect, useState } from 'react';
import { useAIStore } from '@/app/store/useAIStore';
import { AI_LEVEL_CONFIGS } from '@/types/ai-companion';
import { Panel } from '@/app/components/ui';

interface AICompanionPanelProps {
  userId: string;
  gameState?: any;
}

export const AICompanionPanel: React.FC<AICompanionPanelProps> = ({ userId, gameState }) => {
  const { 
    companion, 
    suggestions, 
    isProcessing,
    initializeAI,
    loadAIState,
    generateSuggestions,
    dismissSuggestion,
    acceptSuggestion,
    calculateAccuracy
  } = useAIStore();

  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!companion) {
      loadAIState(userId);
    }
  }, [userId, companion, loadAIState]);

  useEffect(() => {
    // Generate suggestions periodically
    const interval = setInterval(() => {
      if (companion && gameState && !isProcessing) {
        generateSuggestions(gameState);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [companion, gameState, isProcessing, generateSuggestions]);

  if (!companion) {
    return (
      <Panel className="ai-companion-panel loading">
        <div className="text-center p-4">
          <p>Initializing AI Companion...</p>
        </div>
      </Panel>
    );
  }

  const config = AI_LEVEL_CONFIGS[companion.level];
  const accuracy = calculateAccuracy();
  const nextLevel = Object.values(AI_LEVEL_CONFIGS).find(
    c => c.requiredExperience > companion.experience
  );
  const experienceProgress = nextLevel 
    ? (companion.experience / nextLevel.requiredExperience) * 100
    : 100;

  return (
    <Panel className="ai-companion-panel">
      <div className="ai-header">
        <div className="ai-info">
          <h3 className="ai-name">{companion.name}</h3>
          <div className="ai-level">
            <span className={`level-badge ${companion.level}`}>
              {companion.level.toUpperCase()}
            </span>
            <span className="accuracy">
              {(accuracy * 100).toFixed(1)}% Accuracy
            </span>
          </div>
        </div>
        <button 
          className="toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="ai-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${experienceProgress}%` }}
              />
            </div>
            <div className="progress-text">
              {companion.experience} / {nextLevel?.requiredExperience || '∞'} XP
            </div>
          </div>

          <div className="ai-features">
            <h4>Capabilities:</h4>
            <ul>
              {config.unlockedFeatures.map(feature => (
                <li key={feature} className="feature">
                  ✓ {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </li>
              ))}
            </ul>
            {config.profitBonus > 0 && (
              <p className="bonus-text">
                +{(config.profitBonus * 100).toFixed(0)}% Profit Bonus Active
              </p>
            )}
          </div>

          <div className="ai-suggestions">
            <h4>Current Suggestions:</h4>
            {isProcessing && <p className="loading">Analyzing...</p>}
            {!isProcessing && suggestions.length === 0 && (
              <p className="no-suggestions">No suggestions at this time.</p>
            )}
            {suggestions.map(suggestion => (
              <div key={suggestion.id} className={`suggestion ${suggestion.priority}`}>
                <div className="suggestion-header">
                  <span className="suggestion-type">{suggestion.type}</span>
                  <span className={`priority ${suggestion.priority}`}>
                    {suggestion.priority}
                  </span>
                </div>
                <h5>{suggestion.title}</h5>
                <p>{suggestion.description}</p>
                {suggestion.expectedProfit && (
                  <p className="expected-profit">
                    Expected Profit: ${suggestion.expectedProfit.toLocaleString()}
                  </p>
                )}
                <div className="suggestion-actions">
                  <button 
                    className="btn-accept"
                    onClick={() => acceptSuggestion(suggestion.id)}
                  >
                    Accept
                  </button>
                  <button 
                    className="btn-dismiss"
                    onClick={() => dismissSuggestion(suggestion.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      <style jsx>{`
        .ai-companion-panel {
          position: fixed;
          right: 20px;
          top: 100px;
          width: 320px;
          max-height: 600px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid #00ffcc;
          border-radius: 8px;
          padding: 16px;
          color: white;
          font-family: 'Orbitron', monospace;
          box-shadow: 0 0 20px rgba(0, 255, 204, 0.3);
          z-index: 1000;
        }

        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .ai-name {
          margin: 0;
          font-size: 18px;
          color: #00ffcc;
        }

        .ai-level {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }

        .level-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .level-badge.novice { background: #666; }
        .level-badge.competent { background: #4a90e2; }
        .level-badge.experienced { background: #7b68ee; }
        .level-badge.expert { background: #ff6b6b; }
        .level-badge.master { background: #ffd700; color: #000; }

        .accuracy {
          font-size: 12px;
          color: #aaa;
        }

        .toggle-btn {
          background: none;
          border: 1px solid #00ffcc;
          color: #00ffcc;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }

        .ai-progress {
          margin-bottom: 16px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ffcc, #00ff66);
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 12px;
          color: #aaa;
          text-align: center;
          margin-top: 4px;
        }

        .ai-features {
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .ai-features h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #00ffcc;
        }

        .ai-features ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .feature {
          font-size: 12px;
          color: #ccc;
          margin-bottom: 4px;
        }

        .bonus-text {
          margin-top: 8px;
          font-size: 13px;
          color: #ffd700;
          font-weight: bold;
        }

        .ai-suggestions h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #00ffcc;
        }

        .suggestion {
          margin-bottom: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          border-left: 3px solid #666;
        }

        .suggestion.high { border-left-color: #ff6b6b; }
        .suggestion.medium { border-left-color: #ffd700; }
        .suggestion.low { border-left-color: #4a90e2; }
        .suggestion.critical { 
          border-left-color: #ff0000; 
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .suggestion-type {
          font-size: 11px;
          text-transform: uppercase;
          color: #aaa;
        }

        .priority {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
        }

        .priority.high { background: #ff6b6b; }
        .priority.medium { background: #ffd700; color: #000; }
        .priority.low { background: #4a90e2; }
        .priority.critical { background: #ff0000; }

        .suggestion h5 {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: white;
        }

        .suggestion p {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #ccc;
          line-height: 1.4;
        }

        .expected-profit {
          color: #00ff66 !important;
          font-weight: bold;
        }

        .suggestion-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .btn-accept, .btn-dismiss {
          padding: 4px 12px;
          font-size: 12px;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-accept {
          background: #00ff66;
          color: #000;
        }

        .btn-accept:hover {
          background: #00cc52;
        }

        .btn-dismiss {
          background: rgba(255, 255, 255, 0.1);
          color: #aaa;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-dismiss:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .loading, .no-suggestions {
          text-align: center;
          color: #aaa;
          font-size: 13px;
          padding: 20px 0;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        ::-webkit-scrollbar-thumb {
          background: #00ffcc;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #00ff66;
        }
      `}</style>
    </Panel>
  );
};