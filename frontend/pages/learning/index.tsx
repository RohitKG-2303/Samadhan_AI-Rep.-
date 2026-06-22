import React, { useState } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const LearningPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    issue: '',
    solution: '',
    keyTakeaways: '',
    projectId: '',
    category: '',
    tags: '',
  });
  const [learnings, setLearnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/learning/share`,
        {
          ...formData,
          keyTakeaways: formData.keyTakeaways.split(',').map((t) => t.trim()),
          tags: formData.tags.split(',').map((t) => t.trim()),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setLearnings([...learnings, response.data]);
      setFormData({
        title: '',
        issue: '',
        solution: '',
        keyTakeaways: '',
        projectId: '',
        category: '',
        tags: '',
      });
      toast.success('Learning shared successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to share learning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Share Project Learning</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">New Learning</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Project ID</label>
                <input
                  type="text"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Issue/Problem</label>
                <textarea
                  name="issue"
                  value={formData.issue}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Solution</label>
                <textarea
                  name="solution"
                  value={formData.solution}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Key Takeaways (comma-separated)</label>
                <input
                  type="text"
                  name="keyTakeaways"
                  value={formData.keyTakeaways}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Point 1, Point 2, Point 3"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="bug-fix">Bug Fix</option>
                  <option value="feature">Feature</option>
                  <option value="optimization">Optimization</option>
                  <option value="troubleshooting">Troubleshooting</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Sharing...' : 'Share Learning'}
              </button>
            </form>
          </div>

          {/* Learnings List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Learnings</h2>
            <div className="space-y-3">
              {learnings.length === 0 ? (
                <p className="text-gray-500">No learnings shared yet</p>
              ) : (
                learnings.map((learning) => (
                  <div key={learning.learningId} className="border-l-4 border-blue-600 pl-4 py-2">
                    <h3 className="font-semibold text-gray-800">{learning.title}</h3>
                    <p className="text-sm text-gray-600">Shared on {new Date(learning.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LearningPage;
