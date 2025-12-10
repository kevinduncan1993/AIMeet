'use client'

import { useBusiness } from '@/lib/hooks/useBusiness'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FAQItem } from '@/types/database'

export default function KnowledgeBasePage() {
  const { business } = useBusiness()
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null)
  const supabase = createClient()

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    fetchFaqs()
  }, [business])

  async function fetchFaqs() {
    if (!business) return

    try {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .eq('business_id', business.id)
        .order('display_order', { ascending: true })

      if (error) throw error
      setFaqs(data || [])
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return

    try {
      if (editingFaq) {
        const { error } = await supabase
          .from('faq_items')
          .update({ question, answer, category })
          .eq('id', editingFaq.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('faq_items').insert({
          business_id: business.id,
          question,
          answer,
          category,
          is_active: true,
        })

        if (error) throw error
      }

      resetForm()
      fetchFaqs()
    } catch (error) {
      console.error('Error saving FAQ:', error)
      alert('Error saving FAQ')
    }
  }

  const resetForm = () => {
    setQuestion('')
    setAnswer('')
    setCategory('')
    setShowForm(false)
    setEditingFaq(null)
  }

  const handleEdit = (faq: FAQItem) => {
    setQuestion(faq.question)
    setAnswer(faq.answer)
    setCategory(faq.category || '')
    setEditingFaq(faq)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return

    try {
      const { error } = await supabase.from('faq_items').delete().eq('id', id)
      if (error) throw error
      fetchFaqs()
    } catch (error) {
      console.error('Error deleting FAQ:', error)
    }
  }

  if (loading) {
    return <div>Loading knowledge base...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-600 mt-1">
            Add FAQs to help your AI assistant answer customer questions
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          {showForm ? 'Cancel' : 'Add FAQ'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingFaq ? 'Edit FAQ' : 'New FAQ'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="What are your business hours?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="We're open Monday-Friday, 9am-5pm..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category (optional)
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="General, Pricing, Services, etc."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                {editingFaq ? 'Update FAQ' : 'Create FAQ'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {faqs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No FAQs yet
          </h3>
          <p className="text-gray-600 mb-6">
            Add frequently asked questions to train your AI assistant
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Add Your First FAQ
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-700">{faq.answer}</p>
                  {faq.category && (
                    <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                      {faq.category}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(faq)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
