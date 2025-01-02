import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from '@remix-run/react';
import { QRCodeSVG } from 'qrcode.react';

export default function Index() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<{ sender: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const isChat = searchParams.get('interface') === 'chat';
  const ip = searchParams.get('ip');

  useEffect(() => {
    if (isChat) {
      setShowChat(true);
    }

    if (ip) {
      wsRef.current = new WebSocket(`ws://${ip}:3000/ws`);
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
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
      };
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [ip, isChat]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (input) {
      setMessages(prev => [...prev, { sender: 'You', content: input }]);
      wsRef.current?.send(input);
      setInput('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="font-sans max-w-3xl mx-auto p-5">
      <h1 className="text-2xl font-bold mb-4">Yidam Chat</h1>
      {!showChat && (
        <div className="text-center mb-5">
          <QRCodeSVG 
            value={`http://${ip}:3000?ip=${ip}&interface=chat`} 
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
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-grow border border-gray-300 p-2 mr-2"
            />
            <button 
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}