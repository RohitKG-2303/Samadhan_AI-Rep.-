import React, { useState } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const TroubleshootingPage = () => {
  const [question, setQuestion] = useState('');
  const [projectId, setProjectId] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/troubleshooting/ask`,
        {
          question,
          projectId,
          conversationId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setConversationId(response.data.conversationId);
      setMessages([
        ...messages,
        { role: 'user', content: question },
        { role: 'assistant', content: response.data.answer, sources: response.data.sources },
      ]);
      setQuestion('');
      toast.success('Answer generated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/troubleshooting/feedback`,
        {
          queryId: messages.length,
          rating,
          helpful,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success('Thank you for your feedback!');
      setRating(0);
    } catch (error: any) {
      toast.error('Failed to submit feedback');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Smart Troubleshooting Guide</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Project ID (Optional)
            </label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter project ID for context"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No messages yet. Ask a question to get started!</p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 text-sm">
                        <p className="font-semibold">Sources:</p>
                        {msg.sources.map((source, i) => (
                          <p key={i}>{source.title}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAskQuestion} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Ask your question here..."
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </form>

          {messages.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Was this answer helpful?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFeedback(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
                >
                  👍 Helpful
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
                >
                  👎 Not Helpful
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TroubleshootingPage;
