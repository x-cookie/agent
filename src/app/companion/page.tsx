/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const ChatBot3DAvatar = dynamic(() => import('@/components/chat/ChatBot3DAvatar').then(m => m.ChatBot3DAvatar), { ssr: false });
const ChatMessageBubble = dynamic(() => import('@/components/chat/ChatMessageBubble').then(m => m.ChatMessageBubble), { ssr: false });

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function CompanionPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll disabled - user controls scroll
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

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
          featureName: 'companion',
          message: messageText,
          chatHistory: currentMessages
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.content || '[No response]';

      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection error';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--t1)', padding: '24px' }}>
      {/* Navigation Bar */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '48px' }}>
        <Link href="/" style={{ fontSize: '14px', color: 'var(--t3)', textDecoration: 'none', display: 'inline-block' }}>
          ← Back to Agent Learn
        </Link>
      </div>

      {/* Hero Section */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '64px', textAlign: 'left', animation: 'fadeInUp 0.8s ease-out' }}>
        <h1 style={{ fontSize: '56px', fontWeight: 300, marginBottom: '24px', fontStyle: 'italic', color: 'var(--t1)' }}>
          COMPANION
        </h1>

        <div style={{ fontSize: '20px', lineHeight: 1.8, color: 'var(--t2)', maxWidth: '800px', marginBottom: '48px' }}>
          <p style={{ marginBottom: '12px' }}>You don't build alone.</p>
          <p style={{ color: 'var(--t2)', opacity: 0.95, marginBottom: '24px' }}>
            Meet someone who gets your pace. Who knows agents like you're learning them. Who can explain the WHY when it matters, and stay quiet when you've got it. Your mentor. Always here.
          </p>
          <a href="#chat-section" style={{ display: 'inline-block', padding: '12px 28px', background: '#ffffff', color: '#1a1a1a', textDecoration: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, transition: 'all 0.3s', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'translateY(0)'; }}>
Start Learning
          </a>
        </div>
      </div>

      {/* Model + Chat Grid */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '64px' }}>
        <div className="companion-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px', height: '700px' }}>

          {/* Left: 3D Model */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '0.5px solid var(--bd2)', padding: '24px', background: 'var(--bg2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '16px', textAlign: 'center' }}>
              Drag to rotate • Scroll to zoom
            </div>
            <ChatBot3DAvatar size={400} />
          </div>

          {/* Right: Chat Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '0.5px solid var(--bd2)', background: 'var(--bg2)', overflow: 'hidden', height: '100%' }}>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '0', background: 'linear-gradient(180deg, rgba(0, 217, 255, 0.02) 0%, transparent 100%)' }}>
              {messages.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t3)', fontSize: '14px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Your Mentor</div>
                    <div>Hi! What can I help you learn?</div>
                  </div>
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
                      <span style={{ marginLeft: '4px' }}>Thinking…</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div style={{ padding: '16px', borderTop: '0.5px solid rgba(139, 92, 246, 0.15)', background: 'rgba(139, 92, 246, 0.03)', display: 'flex', gap: '8px' }}>
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
                  border: '0.5px solid var(--bd2)',
                  borderRadius: '4px',
                  background: 'var(--bg3)',
                  color: 'var(--t1)',
                  outline: 'none',
                  opacity: loading ? 0.6 : 1,
                  transition: 'border-color 0.15s'
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--purple)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--bd2)')}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                style={{
                  padding: '10px 14px',
                  background: input.trim() && !loading ? '#ffffff' : 'var(--bg3)',
                  border: 'none',
                  borderRadius: '4px',
                  color: input.trim() && !loading ? '#000' : 'var(--t4)',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  if (input.trim() && !loading) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
                onMouseLeave={(e) => {
                  if (input.trim() && !loading) {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                SEND
              </button>
            </div>

            {/* Suggestions (only show when no messages) */}
            {messages.length === 0 && (
              <div style={{ padding: '12px 16px', borderTop: '0.5px solid rgba(255, 255, 255, 0.15)', fontSize: '12px', color: 'var(--t3)' }}>
                <div style={{ marginBottom: '8px' }}>💡 Try asking:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    onClick={() => handleSend('Tell me about lessons')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: '12px', textAlign: 'left', transition: 'all 0.2s', padding: '4px 8px', marginLeft: '-8px', borderRadius: '4px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 255, 255, 0.25)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    • What lessons should I take?
                  </button>
                  <button
                    onClick={() => handleSend('How do battles work')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: '12px', textAlign: 'left', transition: 'all 0.2s', padding: '4px 8px', marginLeft: '-8px', borderRadius: '4px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 255, 255, 0.25)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    • How do battles work?
                  </button>
                  <button
                    onClick={() => handleSend('What is an agent')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: '12px', textAlign: 'left', transition: 'all 0.2s', padding: '4px 8px', marginLeft: '-8px', borderRadius: '4px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 255, 255, 0.25)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    • What is an agent?
                  </button>
                </div>
              </div>
            )}

            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
              }
            `}</style>
          </div>

        </div>
      </div>

      {/* Value Section */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '64px', paddingTop: '64px', paddingBottom: '64px', borderTop: '0.5px solid var(--bd2)', borderBottom: '0.5px solid var(--bd2)' }}>
        <div style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 300, marginBottom: '24px', color: 'var(--t1)' }}>HOW THIS WORKS</h2>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--t2)', marginBottom: '16px' }}>
            Ask about lessons you're on. Marketplace mechanics that confuse you. Why your agent lost that battle. Whether you're building or stuck—your mentor knows the context.
          </p>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--t2)', marginBottom: '48px' }}>
            Not a search engine. Not generic docs. Someone who explains *your* next step, not everyone's.
          </p>

          <h2 style={{ fontSize: '28px', fontWeight: 300, marginBottom: '24px', color: 'var(--t1)' }}>WHY IT MATTERS</h2>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--t2)' }}>
            Most platforms teach. Few listen. Your mentor does both. They're not here to show off—they're here because you matter, and your learning is worth slowing down for.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '80px', paddingTop: '80px', borderTop: '0.5px solid var(--bd2)' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 300, marginBottom: '64px', color: 'var(--t1)', textAlign: 'center' }}>WHAT YOU GET</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
          <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', padding: '32px', background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', animation: 'slideInLeft 0.6s ease-out' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--bg3)', border: '0.5px solid var(--bd2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', transition: 'all 0.3s ease', animation: 'float 3s ease-in-out infinite' }}>
              <i className="ti ti-brain" style={{ fontSize: '28px', color: '#ffffff' }} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--t1)', marginBottom: '12px' }}>Context Matters</div>
            <div style={{ fontSize: '14px', color: 'var(--t2)', lineHeight: 1.7 }}>Your mentor knows which lesson you're on. They know what you're building. Explanations adapt to your exact level, not a generic curriculum.</div>
          </div>
          <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', padding: '32px', background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', animation: 'fadeInUp 0.6s ease-out 0.1s backwards' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--bg3)', border: '0.5px solid var(--bd2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', transition: 'all 0.3s ease', animation: 'float 3s ease-in-out 0.3s infinite' }}>
              <i className="ti ti-clock" style={{ fontSize: '28px', color: 'var(--purple)' }} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--t1)', marginBottom: '12px' }}>Always Available</div>
            <div style={{ fontSize: '14px', color: 'var(--t2)', lineHeight: 1.7 }}>No queue. No office hours. Stuck at 2am? Chat now. Get real answers in seconds. Your learning pace, not the institution's.</div>
          </div>
          <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', padding: '32px', background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', animation: 'slideInRight 0.6s ease-out 0.2s backwards' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--bg3)', border: '0.5px solid var(--bd2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', transition: 'all 0.3s ease', animation: 'float 3s ease-in-out 0.6s infinite' }}>
              <i className="ti ti-bulb" style={{ fontSize: '28px', color: 'var(--purple)' }} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--t1)', marginBottom: '12px' }}>Real Explanations</div>
            <div style={{ fontSize: '14px', color: 'var(--t2)', lineHeight: 1.7 }}>Not docs. Not buzzwords. The "why" behind concepts you're learning—the thing textbooks skip—in language you actually get.</div>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '80px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 300, marginBottom: '64px', color: 'var(--t1)', textAlign: 'center' }}>WHEN YOU'D USE IT</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
          <div className="use-case-card" style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', animation: 'slideInLeft 0.6s ease-out 0.2s backwards', cursor: 'pointer' }}>
            <div className="case-title" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--purple)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'color 0.3s ease' }}>Lesson Stuck</div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--t1)', marginBottom: '12px', lineHeight: 1.5 }}>"Wait, why does the agent need perception AND reasoning?"</div>
            <div style={{ fontSize: '14px', color: 'var(--t2)', lineHeight: 1.7, flex: 1 }}>Mentor breaks it down with concrete examples. Shows why it matters. Connects to what's coming next. You finally get it.</div>
          </div>
          <div className="use-case-card" style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.6s ease-out 0.3s backwards', cursor: 'pointer' }}>
            <div className="case-title" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--purple)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'color 0.3s ease' }}>Battle Loss</div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--t1)', marginBottom: '12px', lineHeight: 1.5 }}>"My agent got crushed. What went wrong?"</div>
            <div style={{ fontSize: '14px', color: 'var(--t2)', lineHeight: 1.7, flex: 1 }}>Mentor analyzes your agent's decisions. Points to specific gaps. Suggests what to practice. You iterate smarter.</div>
          </div>
          <div className="use-case-card" style={{ background: 'var(--bg2)', border: '0.5px solid var(--bd2)', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.6s ease-out 0.4s backwards', cursor: 'pointer' }}>
            <div className="case-title" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--purple)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'color 0.3s ease' }}>Marketplace Confused</div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--t1)', marginBottom: '12px', lineHeight: 1.5 }}>"How do I price this? What makes an agent valuable?"</div>
            <div style={{ fontSize: '14px', color: 'var(--t2)', lineHeight: 1.7, flex: 1 }}>Real talk on pricing strategy. Market mechanics. What buyers actually want. You sell smarter.</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center', paddingTop: '48px', borderTop: '0.5px solid var(--bd2)' }}>
        <p style={{ fontSize: '13px', color: 'var(--t3)', marginBottom: '20px' }}>
          Ready to learn more? Return to:
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/learn" style={{ fontSize: '13px', color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.15s', display: 'inline-block' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--purple)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t3)'; }}>Learn</Link>
          <span style={{ color: 'var(--t4)' }}>•</span>
          <a href="/marketplace" style={{ fontSize: '13px', color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--purple)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t3)'; }}>Marketplace</a>
          <span style={{ color: 'var(--t4)' }}>•</span>
          <a href="/battle" style={{ fontSize: '13px', color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--purple)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t3)'; }}>Battle</a>
          <span style={{ color: 'var(--t4)' }}>•</span>
          <a href="/missions" style={{ fontSize: '13px', color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--purple)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t3)'; }}>Missions</a>
        </div>
      </div>

      {/* Responsive styles + animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
        }
        .feature-card {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .feature-card:hover {
          transform: translateY(-8px);
          border-color: var(--purple);
          box-shadow: 0 12px 40px rgba(139, 92, 246, 0.2);
        }
        .use-case-card {
          transition: all 0.3s ease;
        }
        .use-case-card:hover {
          border-color: var(--purple);
          box-shadow: 0 8px 32px rgba(139, 92, 246, 0.15);
          transform: translateY(-4px);
        }
        .use-case-card:hover .case-title {
          color: var(--purple);
        }
        @media (max-width: 768px) {
          .companion-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
        @media (max-width: 480px) {
          .companion-grid {
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
