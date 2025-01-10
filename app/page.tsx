import { Suspense } from 'react';
import ChatComponent from './ChatComponent';

export default function Page() {
  return (
    <div className="font-sans max-w-3xl mx-auto p-5">
      <h1 className="text-2xl font-bold mb-4 text-center">Yidam Chat</h1>
      <Suspense fallback={<div>Loading chat...</div>}>
        <ChatComponent />
      </Suspense>
    </div>
  );
}