'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useEmpireStore } from '@/src/store/empireStore';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestion?: {
    type: string;
    action: () => void;
  };
}

interface AILevel {
  name: string;
  level: number;
  color: string;
  capabilities: string[];
}

export const AICompanionPanel: React.FC = () => {
  const { player, ships, routes, marketPrices } = useEmpireStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello Captain! I'm your AI logistics assistant. I'll help you optimize routes, manage your fleet, and maximize profits. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiLevel, setAiLevel] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiLevels: AILevel[] = [
    { name: 'Novice', level: 1, color: 'text-gray-600', capabilities: ['Basic tips', 'Market alerts'] },
    { name: 'Apprentice', level: 2, color: 'text-green-600', capabilities: ['Route suggestions', 'Profit analysis'] },
    { name: 'Expert', level: 3, color: 'text-blue-600', capabilities: ['Fleet optimization', 'Risk assessment'] },
    { name: 'Master', level: 4, color: 'text-purple-600', capabilities: ['Advanced strategies', 'Market prediction'] },
    { name: 'Grandmaster', level: 5, color: 'text-yellow-600', capabilities: ['AI-driven automation', 'Global optimization'] },
  ];

  const currentAILevel = aiLevels.find(l => l.level === aiLevel) || aiLevels[0];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Context-aware responses based on game state
    if (lowerMessage.includes('profit') || lowerMessage.includes('money')) {
      const suggestion = analyzeFinancialSituation();
      return suggestion;
    }
    
    if (lowerMessage.includes('route') || lowerMessage.includes('ship')) {
      const suggestion = analyzeRoutes();
      return suggestion;
    }
    
    if (lowerMessage.includes('market') || lowerMessage.includes('trade')) {
      const suggestion = analyzeMarket();
      return suggestion;
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what')) {
      return getHelpMessage();
    }
    
    // Default contextual response
    return getContextualAdvice();
  };

  const analyzeFinancialSituation = (): string => {
    const cash = player?.cash || 0;
    if (cash < 10000) {
      return "⚠️ Your cash reserves are running low. Consider taking on high-profit routes or selling some assets. The Electronics market is showing strong growth (+5.2%) - might be a good trading opportunity!";
    } else if (cash > 100000) {
      return "💰 Excellent cash position! You might want to invest in expanding your fleet or establishing new trade routes. The Asia-Europe corridor is particularly profitable right now.";
    }
    return "📊 Your financial situation is stable. Focus on optimizing existing routes for better margins. I've noticed your Shanghai-Rotterdam route has the highest profit potential.";
  };

  const analyzeRoutes = (): string => {
    if (ships.length === 0) {
      return "🚢 You don't have any ships yet! Start by purchasing a vessel from the fleet menu. I recommend starting with a medium-sized container ship for flexibility.";
    }
    
    if (aiLevel >= 2) {
      return "🗺️ Based on current market conditions, I suggest establishing a triangular route: LA → Tokyo → Shanghai → LA. This maximizes cargo utilization and reduces empty runs. Expected profit: $75,000 per cycle.";
    }
    
    return "📍 Try connecting major ports with high demand. Shanghai and Rotterdam are excellent starting points for profitable routes!";
  };

  const analyzeMarket = (): string => {
    const trending = marketPrices.find(m => m.trend === 'up' && m.change > 3);
    if (trending) {
      return `📈 ${trending.good} is trending up (+${trending.change}%)! Consider buying now and selling at destination ports. Based on my analysis, you could make a ${Math.round(trending.change * 2)}% profit on this trade.`;
    }
    return "📊 Markets are relatively stable. Focus on high-volume goods like Electronics and Containers for steady profits. Oil prices are down (-2.1%), making it a good time to refuel your fleet.";
  };

  const getHelpMessage = (): string => {
    const tips = [
      "💡 Start by creating routes between major ports",
      "💡 Buy low in one market and sell high in another",
      "💡 Keep an eye on fuel costs - they impact your profit margins",
      "💡 Upgrade your ships for better capacity and speed",
      "💡 Weather and events can affect route profitability"
    ];
    return `Here are some tips to get you started:\n${tips.join('\n')}\n\nAsk me about specific topics like routes, trading, or fleet management!`;
  };

  const getContextualAdvice = (): string => {
    const adviceOptions = [
      "🎯 Pro tip: Establishing regular routes builds reputation with ports, leading to reduced fees over time.",
      "⚡ Quick suggestion: Check the market panel - I've spotted some profitable arbitrage opportunities!",
      "🌊 Weather alert: Storms predicted in the Pacific. Consider rerouting ships to avoid delays.",
      "📈 Market insight: Demand for Electronics is rising in European ports. Stock up in Asia!",
      "🔧 Maintenance reminder: Regular ship maintenance prevents costly breakdowns at sea."
    ];
    
    if (aiLevel >= 3) {
      adviceOptions.push(
        "🧠 Advanced strategy: Use leveraged contracts to lock in future prices and guarantee profits.",
        "🎪 Market manipulation: Large bulk purchases can influence local market prices in your favor."
      );
    }
    
    return adviceOptions[Math.floor(Math.random() * adviceOptions.length)];
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: "Best Route?", query: "What's the most profitable route right now?" },
    { label: "Market Tips", query: "Any good trading opportunities?" },
    { label: "Fleet Status", query: "How's my fleet doing?" },
    { label: "Strategy", query: "What should I focus on next?" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* AI Level Indicator */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">AI Assistant Level</span>
          <span className={`font-bold ${currentAILevel.color}`}>
            {currentAILevel.name}
          </span>
        </div>
        <div className="flex gap-1 mb-2">
          {aiLevels.map(level => (
            <div
              key={level.level}
              className={`flex-1 h-2 rounded-full ${
                level.level <= aiLevel ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <div className="text-xs text-gray-600">
          Capabilities: {currentAILevel.capabilities.join(', ')}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-y-auto mb-4">
        <div className="space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
                <p className={`text-xs text-gray-500 mt-1 ${
                  message.type === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.type === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 order-1">
                  <span className="text-sm">🤖</span>
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {quickActions.map(action => (
          <button
            key={action.label}
            onClick={() => setInputMessage(action.query)}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-full text-gray-700 transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask your AI assistant..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isTyping}
        />
        <Button
          onClick={handleSendMessage}
          variant="primary"
          disabled={!inputMessage.trim() || isTyping}
        >
          Send
        </Button>
      </div>

      {/* AI Training Progress */}
      {aiLevel < 5 && (
        <div className="mt-3 text-xs text-gray-600 text-center">
          <p>AI learns from your decisions • {(aiLevel * 20)}% to next level</p>
        </div>
      )}
    </div>
  );
};

export default AICompanionPanel;