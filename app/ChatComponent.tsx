"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic'
import ClientOnly from './ClientOnly'

export default function ChatComponent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<{ sender: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const PORT_SERVER = 3001;
  const QRCodeSVG = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), { ssr: false })

  const isChat = searchParams.get('interface') === 'chat';
  const IP = typeof window !== 'undefined' ? window.location.href.split('/')[2].split(':')[0] : '';

  useEffect(() => {
    if (isChat) {
      setShowChat(true);
    }

    if (IP) {
      wsRef.current = new WebSocket(`ws://${IP}:${PORT_SERVER}/ws`);
      console.log('Connecting to:', `ws://${IP}:${PORT_SERVER}/ws`);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        const data = event.data;
        
        if (data === "[START]") {
          setMessages(prev => [...prev, { sender: 'LLM', content: '' }]);
        } else if (data === "[END]") {
          // Do nothing
        } else {
          setMessages(prev => {
            if (prev.length === 0) return prev;
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content += data;
            return newMessages;
          });
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
  
      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
      };
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [IP, isChat]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (input && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setMessages(prev => [...prev, { sender: 'You', content: input }]);
      console.log('Sending:', input);
      wsRef.current.send(input);
      console.log('Sent:', input);
      setInput('');
    } else if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <ClientOnly>
      {!showChat && (
        <div className="text-center mb-5">
          <QRCodeSVG 
            key={`http://${IP}:${PORT_SERVER}/web/?interface=chat`}
            value={`http://${IP}:${PORT_SERVER}/web/?interface=chat`} 
            size={256} 
            className="mx-auto mb-4"
          />
          <button 
            onClick={() => setShowChat(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Simulate QR Code Scan
          </button>
        </div>
      )}
      {showChat && (
        <div className="flex flex-col h-[500px]">
          <div className="mb-2">
            Connection status: {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div ref={chatRef} className="flex-grow overflow-y-auto border border-gray-300 p-3 mb-3">
            {messages.map((message, index) => (
              <div key={index} className="mb-2">
                <span className="font-bold">{message.sender}:</span> {message.content}
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="flex-grow border border-gray-300 p-2 mr-2"
            />
            <button 
              onClick={sendMessage}
              disabled={!isConnected}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${!isConnected && 'opacity-50 cursor-not-allowed'}`}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </ClientOnly>
  );
}