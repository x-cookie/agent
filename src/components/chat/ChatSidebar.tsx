'use client';

import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { getChatContext, type FeatureName } from '@/lib/chatContexts';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatMarkdownRenderer } from './ChatMarkdownRenderer';

const ChatBot3DAvatar = dynamic(() => import('./ChatBot3DAvatar').then(m => m.ChatBot3DAvatar), { ssr: false });

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function getFeatureFromPath(pathname: string): FeatureName | null {
  if (pathname.startsWith('/learn')) return 'learn';
  if (pathname.startsWith('/marketplace')) return 'marketplace';
  if (pathname.startsWith('/battle')) return 'battle';
  if (pathname.startsWith('/missions')) return 'missions';
  if (pathname === '/') return 'landing';
  return null;
}

function getFeatureIcon(feature: FeatureName | null): string {
  const icons: Record<FeatureName, string> = {
    learn: 'ti-book',
    marketplace: 'ti-shopping-cart',
    battle: 'ti-sword',
    missions: 'ti-rocket',
    landing: 'ti-home'
  };
  return feature ? icons[feature] : 'ti-message-circle-2';
}


export function ChatSidebar() {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const feature = getFeatureFromPath(pathname);
  const context = feature ? getChatContext(feature) : null;
  const featureIcon = getFeatureIcon(feature);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || !feature || loading) return;

    setInput('');
    setLoading(true);

    const userMsg: Message = { role: 'user', content: messageText };
    let currentMessages: Message[] = [];
    setMessages(prev => {
      currentMessages = [...prev, userMsg];
      return currentMessages;
    });

    try {
      const response = await fetch('/api/chat/feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureName: feature,
          message: messageText,
          chatHistory: currentMessages
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setMessages(prev => {
          const lastMsg = { ...prev[prev.length - 1] };
          lastMsg.content += chunk;
          return [...prev.slice(0, -1), lastMsg];
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection error';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!context || feature === 'learn') return null;

  return (
    <>
      {/* Toggle button - 3D Model */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 40,
            width: '150px',
            height: '150px',
            borderRadius: '12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'all 0.3s'
          }}
          title="Chat assistant"
        >
          <ChatBot3DAvatar size={150} />
        </button>
      )}


      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: '360px',
          height: '600px',
          maxHeight: '90vh',
          background: 'rgba(10, 10, 15, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '0.5px solid rgba(139, 92, 246, 0.15)',
          borderBottomLeftRadius: isOpen ? '16px' : '16px',
          borderBottomRightRadius: '0px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: isOpen ? '0 -8px 32px rgba(139, 92, 246, 0.15)' : 'none'
        }}
      >
        {/* Close button */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10
          }}
        >
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--t3)',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px 8px',
              transition: 'color 0.2s'
            }}
            title="Close"
          >
            <i className="ti ti-x" aria-hidden />
          </button>
        </div>

        {/* 3D Model Section - Show only when idle (no messages) */}
        {messages.length === 0 && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', borderBottom: '0.5px solid rgba(139, 92, 246, 0.1)' }}>
            <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.4, textAlign: 'center' }}>
              Need help? Ask me anything about {feature}
            </div>
            <ChatBot3DAvatar size={240} />
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '60px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t3)', fontSize: '12px' }}>
              Ready to chat…
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessageBubble key={i} message={msg} isLast={i === messages.length - 1} />
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '12px', color: 'var(--t3)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--acc)', animation: 'pulse 1.4s infinite' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--acc)', animation: 'pulse 1.4s infinite 0.2s' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--acc)', animation: 'pulse 1.4s infinite 0.4s' }} />
                  <span style={{ marginLeft: '4px' }}>Agent thinking…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>


        {/* Input area */}
        <div
          style={{
            padding: '12px',
            borderTop: '0.5px solid rgba(139, 92, 246, 0.15)',
            background: 'rgba(139, 92, 246, 0.03)',
            display: 'flex',
            gap: '8px'
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask something…"
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: '14px',
              border: '0.5px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '6px',
              background: 'rgba(10, 10, 15, 0.7)',
              color: 'var(--t1)',
              outline: 'none',
              opacity: loading ? 0.6 : 1,
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(139, 92, 246, 0.15)')}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{
              padding: '10px 14px',
              background: input.trim() && !loading ? 'var(--purple)' : 'rgba(139, 92, 246, 0.1)',
              border: 'none',
              borderRadius: '6px',
              color: input.trim() && !loading ? '#fff' : 'var(--t4)',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              transition: 'all 0.2s',
              fontWeight: 500
            }}
            title="Send (or press Enter)"
          >
            <i className="ti ti-send" aria-hidden />
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 45,
            backdropFilter: 'blur(3px)'
          }}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
