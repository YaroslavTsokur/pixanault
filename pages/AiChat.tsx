// AiChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Paperclip, AlertTriangle } from 'lucide-react';
import { ChatMessage } from '../types';
import { api } from '../services/api';

const AiChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Здравствуйте! Я ваш AI-ассистент Pixana. Я подключен к оперативной базе данных строительных проектов. Могу проанализировать риски, найти лиды или подготовить саммари по регионам. О чем рассказать?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const connectToAi = async () => {
      try {
        await api.chat.init();
        setIsConnected(true);
      } catch (e) {
        console.error("AI connection failed", e);
      }
    };
    connectToAi();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await api.chat.sendMessage(userMsg.content);

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "Произошла ошибка при обращении к AI сервису. Попробуйте позже.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    // Добавление фоновых стилей чата (если не управляются родительским элементом)
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6 max-w-5xl mx-auto transition-colors duration-300">
      <div className="flex-1 overflow-y-auto pr-4 mb-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
              
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 
                ${msg.role === 'ai' 
                  ? 'bg-gradient-to-br from-pixana-purple to-pixana-pink text-white shadow-lg' 
                  // ИЗМЕНЕНИЕ: Аватар пользователя
                  : 'bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-gray-400'}`}>
                {msg.role === 'ai' ? <Sparkles size={20} /> : <User size={20} />}
              </div>

              {/* Bubble */}
              <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user' 
                  // Пузырь пользователя (хорошо выглядит в обеих темах)
                  ? 'bg-pixana-purple text-white rounded-tr-none' 
                  // ИЗМЕНЕНИЕ: Пузырь AI
                  : 'bg-white dark:bg-gray-700 border border-slate-100 dark:border-gray-600 text-slate-700 dark:text-gray-100 rounded-tl-none'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pixana-purple to-pixana-pink text-white flex items-center justify-center">
                  <Bot size={20} className="animate-pulse"/>
                </div>
                {/* ИЗМЕНЕНИЕ: Пузырь "Печатает" */}
                <div className="bg-white dark:bg-gray-700 border border-slate-100 dark:border-gray-600 p-4 rounded-2xl rounded-tl-none">
                  <div className="flex space-x-1.5">
                    {/* ИЗМЕНЕНИЕ: Точки */}
                    <div className="w-2 h-2 bg-slate-300 dark:bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-300 dark:bg-gray-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-slate-300 dark:bg-gray-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {/* ИЗМЕНЕНИЕ: Контейнер ввода */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/20">
        <div className="relative flex items-center">
          {/* ИЗМЕНЕНИЕ: Кнопка Скрепка */}
          <button className="p-2 text-slate-400 dark:text-gray-500 hover:text-pixana-purple transition-colors">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Спросите о событиях, трендах или компаниях..."
            // ИЗМЕНЕНИЕ: Поле ввода
            className="flex-1 mx-4 bg-transparent outline-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-pixana-purple text-white rounded-lg hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex justify-between items-center mt-2 px-1">
          {/* ИЗМЕНЕНИЕ: Индикатор подключения */}
          <div className="text-xs text-slate-400 dark:text-gray-500">
            {isConnected 
              ? "● AI подключен к базе данных (Secure Connection)" 
              : "○ Подключение к серверу..."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChat;