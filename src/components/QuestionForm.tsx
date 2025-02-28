import { useState } from 'react';

interface Question {
  id: string;
  text: string;
}

interface QuestionFormProps {
  onSubmit: (formData: { title: string; description: string; questions: Question[] }) => void;
}

export default function QuestionForm({ onSubmit }: QuestionFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');

  const addQuestion = () => {
    if (newQuestion.trim() === '') return;
    
    const question: Question = {
      id: crypto.randomUUID(),
      text: newQuestion.trim()
    };
    
    setQuestions([...questions, question]);
    setNewQuestion('');
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, questions });
  };

  return (
    <div className="bg-white shadow-form-card rounded-lg p-8 max-w-4xl mx-auto border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-duke-blue flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Create Connection Form
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-field">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Form Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-duke-blue focus:border-duke-blue transition-colors"
            placeholder="Give your form a title"
            required
          />
        </div>
        
        <div className="form-field">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-duke-blue focus:border-duke-blue transition-colors"
            placeholder="Describe what this form is about"
            rows={3}
          />
        </div>
        
        <div className="form-field bg-duke-lightgray p-6 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-duke-blue mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Questions
          </label>
          
          <div className="space-y-3 mb-4">
            {questions.map((question) => (
              <div key={question.id} className="flex items-center gap-2 p-4 bg-white rounded-md shadow-sm border border-gray-200 hover:border-duke-blue transition-colors">
                <div className="flex-grow">{question.text}</div>
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className="text-gray-500 hover:text-duke-accent transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-duke-blue focus:border-duke-blue transition-colors"
              placeholder="Type a new question here"
            />
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 bg-duke-blue text-white rounded-md hover:bg-duke-darkblue focus:outline-none focus:ring-2 focus:ring-duke-blue focus:ring-offset-2 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-3 bg-duke-blue text-white rounded-md hover:bg-duke-darkblue focus:outline-none focus:ring-2 focus:ring-duke-blue focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center font-medium"
            disabled={questions.length === 0 || !title}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Create Form
          </button>
        </div>
      </form>
    </div>
  );
} 