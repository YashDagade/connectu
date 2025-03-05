'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getFormById,
  getFormResponses,
  getFormConnections,
  processFormResponses,
  generateAndStoreConnections,
  stopAcceptingResponses
} from '@/lib/supabase';

export default function FormConnectionsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  
  useEffect(() => {
    loadFormData();
  }, [formId]);
  
  async function loadFormData() {
    setLoading(true);
    try {
      // Load form data
      const formData = await getFormById(formId);
      setForm(formData.form);
      
      // Load responses
      const responsesData = await getFormResponses(formId);
      setResponses(responsesData.responses || []);
      
      // Load existing connections
      if (formData.form.connections_generated) {
        const connectionsData = await getFormConnections(formId);
        setConnections(connectionsData || []);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      alert('Error loading form data');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleStopAcceptingResponses() {
    try {
      await stopAcceptingResponses(formId);
      alert('Form is no longer accepting responses');
      loadFormData(); // Reload data to reflect the change
    } catch (error) {
      console.error('Error stopping responses:', error);
      alert('Failed to stop accepting responses');
    }
  }
  
  async function handleProcessResponses() {
    setProcessing(true);
    try {
      // First stop accepting responses
      await stopAcceptingResponses(formId);
      
      // Process all responses to generate summaries and embeddings
      await processFormResponses(formId);
      
      alert('Responses processed successfully');
      loadFormData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Error processing responses:', error);
      alert('Failed to process responses');
    } finally {
      setProcessing(false);
    }
  }
  
  async function handleGenerateConnections() {
    setConnecting(true);
    try {
      // Generate and store connections
      const newConnections = await generateAndStoreConnections(formId);
      setConnections(newConnections || []);
      
      alert('Connections generated successfully');
      loadFormData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Error generating connections:', error);
      alert('Failed to generate connections');
    } finally {
      setConnecting(false);
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }
  
  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Form not found</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
        <p className="text-gray-400 mb-6">{form.description}</p>
        
        <div className="mb-8">
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => router.push(`/forms/${formId}`)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition"
            >
              Back to Form
            </button>
            
            {form.is_accepting_responses && (
              <button 
                onClick={handleStopAcceptingResponses}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md transition"
              >
                Stop Accepting Responses
              </button>
            )}
            
            {!form.is_accepting_responses && !form.connections_generated && (
              <button 
                onClick={handleProcessResponses}
                disabled={processing}
                className={`px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-md transition ${
                  processing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {processing ? 'Processing...' : 'Process Responses'}
              </button>
            )}
            
            {!form.is_accepting_responses && !form.connections_generated && responses.some(r => r.summary) && (
              <button 
                onClick={handleGenerateConnections}
                disabled={connecting}
                className={`px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-md transition ${
                  connecting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {connecting ? 'Generating...' : 'Generate Connections'}
              </button>
            )}
          </div>
          
          <div className="stats bg-gray-800 p-4 rounded-lg inline-flex gap-8">
            <div>
              <div className="text-gray-400">Total Responses</div>
              <div className="text-2xl">{responses.length}</div>
            </div>
            <div>
              <div className="text-gray-400">Processed Responses</div>
              <div className="text-2xl">{responses.filter(r => r.summary).length}</div>
            </div>
            <div>
              <div className="text-gray-400">Connections</div>
              <div className="text-2xl">{connections.length}</div>
            </div>
            <div>
              <div className="text-gray-400">Status</div>
              <div className="text-2xl">
                {form.is_accepting_responses 
                  ? <span className="text-green-500">Open</span> 
                  : <span className="text-red-500">Closed</span>}
              </div>
            </div>
          </div>
        </div>
        
        {connections.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Connections</h2>
            <div className="grid gap-4">
              {connections.map((connection, index) => (
                <div key={connection.id} className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">
                        Connection #{index + 1} - Similarity: {(connection.similarity_score * 100).toFixed(1)}%
                      </h3>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="text-lg font-medium mb-2">
                        {connection.response1?.respondent_name}
                      </h4>
                      <p className="text-gray-300 text-sm mb-4">
                        {connection.response1?.respondent_email}
                      </p>
                      <div className="text-gray-300 text-sm max-h-64 overflow-y-auto">
                        {connection.response1?.summary}
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="text-lg font-medium mb-2">
                        {connection.response2?.respondent_name}
                      </h4>
                      <p className="text-gray-300 text-sm mb-4">
                        {connection.response2?.respondent_email}
                      </p>
                      <div className="text-gray-300 text-sm max-h-64 overflow-y-auto">
                        {connection.response2?.summary}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : form.connections_generated ? (
          <div className="text-center py-10">
            <p className="text-xl text-gray-400">No connections were found</p>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-gray-400">
              {form.is_accepting_responses 
                ? 'Stop accepting responses to process and generate connections' 
                : 'Process responses to generate connections'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 