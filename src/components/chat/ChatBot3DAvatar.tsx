/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        'touch-action'?: string;
      };
    }
  }
}

'use client';

import { useEffect } from 'react';

interface ChatBot3DAvatarProps {
  size?: number;
}

export function ChatBot3DAvatar({ size = 240 }: ChatBot3DAvatarProps = {}) {
  useEffect(() => {
    // Load model-viewer from CDN
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js';
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const floatAmplitude = Math.max(3, size * 0.05);

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        overflow: 'hidden',
        margin: '0 auto',
        animation: `float-avatar 4s ease-in-out infinite`
      }}
    >
      {/* @ts-ignore */}
      <model-viewer
        src="/3d-model.glb"
        alt="AI Agent"
        auto-rotate
        camera-controls
        touch-action="pan-y"
        style={{
          width: '100%',
          height: '100%'
        }}
      />

      <style>{`
        @keyframes float-avatar {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-${floatAmplitude}px);
          }
        }

        model-viewer {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
