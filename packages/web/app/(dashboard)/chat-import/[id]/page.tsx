'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ChatResults from '@/components/chat-import/chat-results';

export default function ChatImportResultsPage() {
  const params = useParams();
  const router = useRouter();
  const chatImportId = params.id as string;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Chat Analysis Results</h1>
          <p className="text-gray-600">Detailed analysis of your imported chat</p>
        </div>
      </div>

      <ChatResults chatImportId={chatImportId} />
    </div>
  );
}