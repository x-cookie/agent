'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ChatMarkdownRenderer } from './ChatMarkdownRenderer';

const ChatBot3DAvatar = dynamic(() => import('./ChatBot3DAvatar').then(m => m.ChatBot3DAvatar), { ssr: false });

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessageBubble({ message, isLast }: { message: Message; isLast: boolean }) {
  const isUser = message.role === 'user';
  const [index, setIndex] = useState(0);
  const prevLenRef = useRef(message.content.length);

  // Single effect: typewriter + reset detection
  useEffect(() => {
    if (isUser) return;

    const prevLen = prevLenRef.current;
    prevLenRef.current = message.content.length;

    // Content shrunk = genuinely new message → reset via timeout (avoids sync setState)
    if (message.content.length < prevLen) {
      const t = setTimeout(() => setIndex(0), 0);
      return () => clearTimeout(t);
    }

    // Typewriter: one char per 20ms
    if (index < message.content.length) {
      const t = setTimeout(() => setIndex(index + 1), 20);
      return () => clearTimeout(t);
    }
  }, [isUser, message.content, index]);

  // Derive displayed content — no extra state
  const displayedContent = isUser
    ? message.content
    : message.content.slice(0, index);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: '8px',
        animation: isLast ? 'slideIn 0.3s ease-out' : 'none'
      }}
    >
      {!isUser && (
        <div style={{ width: '40px', height: '40px', flexShrink: 0 }}>
          <ChatBot3DAvatar size={40} />
        </div>
      )}
      <div
        style={{
          maxWidth: isUser ? '85%' : '70%',
          padding: '10px 14px',
          borderRadius: '12px',
          fontSize: '13px',
          lineHeight: 1.5,
          background: isUser
            ? 'var(--purple)'
            : 'rgba(139, 92, 246, 0.08)',
          color: isUser ? '#fff' : 'var(--t1)',
          border: isUser ? 'none' : '0.5px solid rgba(139, 92, 246, 0.15)',
          backdropFilter: isUser ? 'none' : 'blur(4px)',
          boxShadow: isUser ? '0 4px 12px rgba(139, 92, 246, 0.2)' : 'none',
          wordWrap: 'break-word'
        }}
      >
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap' }}>{displayedContent}</div>
        ) : (
          <ChatMarkdownRenderer>{displayedContent}</ChatMarkdownRenderer>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

