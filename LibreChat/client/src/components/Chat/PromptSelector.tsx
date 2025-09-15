import React, { useState, useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';

interface Prompt {
  _id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  variables?: {
    name: string;
    description: string;
    defaultValue: string;
  }[];
  tags: string[];
  usageCount: number;
  rating: number;
}

interface PromptSelectorProps {
  onSelectPrompt: (prompt: string) => void;
}

export default function PromptSelector({ onSelectPrompt }: PromptSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const { token } = useAuthContext();

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'general', label: 'General' },
    { value: 'coding', label: 'Coding' },
    { value: 'writing', label: 'Writing' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'creative', label: 'Creative' },
    { value: 'business', label: 'Business' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchPrompts();
    }
  }, [isOpen, category, search]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin-prompts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts || []);
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyPrompt = async () => {
    if (!selectedPrompt) return;

    try {
      const response = await fetch(`/api/admin-prompts/${selectedPrompt._id}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variables }),
      });

      if (response.ok) {
        const data = await response.json();
        onSelectPrompt(data.prompt);
        setIsOpen(false);
        setSelectedPrompt(null);
        setVariables({});
      }
    } catch (error) {
      console.error('Error applying prompt:', error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        type="button"
      >
        <BookOpen className="h-4 w-4" />
        Prompts
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Select a Prompt</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="flex h-[500px]">
              {/* Prompt List */}
              <div className="w-1/2 p-4 overflow-y-auto border-r dark:border-gray-700">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : prompts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No prompts found</div>
                ) : (
                  <div className="space-y-2">
                    {prompts.map((prompt) => (
                      <div
                        key={prompt._id}
                        onClick={() => {
                          setSelectedPrompt(prompt);
                          const defaultVars: Record<string, string> = {};
                          prompt.variables?.forEach((v) => {
                            defaultVars[v.name] = v.defaultValue || '';
                          });
                          setVariables(defaultVars);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedPrompt?._id === prompt._id
                            ? 'bg-blue-100 dark:bg-blue-900'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <h3 className="font-medium">{prompt.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {prompt.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                            {prompt.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            Used {prompt.usageCount} times
                          </span>
                          {prompt.rating > 0 && (
                            <span className="text-xs text-yellow-600">
                              ★ {prompt.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prompt Details */}
              <div className="w-1/2 p-4 overflow-y-auto">
                {selectedPrompt ? (
                  <>
                    <h3 className="font-semibold text-lg mb-3">{selectedPrompt.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {selectedPrompt.description}
                    </p>

                    {selectedPrompt.variables && selectedPrompt.variables.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Variables</h4>
                        <div className="space-y-3">
                          {selectedPrompt.variables.map((variable) => (
                            <div key={variable.name}>
                              <label className="block text-sm font-medium mb-1">
                                {variable.name}
                                {variable.description && (
                                  <span className="text-gray-500 ml-2">
                                    ({variable.description})
                                  </span>
                                )}
                              </label>
                              <input
                                type="text"
                                value={variables[variable.name] || ''}
                                onChange={(e) =>
                                  setVariables({
                                    ...variables,
                                    [variable.name]: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder={variable.defaultValue}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Preview</h4>
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md whitespace-pre-wrap">
                        {selectedPrompt.prompt.replace(
                          /\{\{\s*(\w+)\s*\}\}/g,
                          (match, varName) => variables[varName] || match
                        )}
                      </div>
                    </div>

                    <button
                      onClick={applyPrompt}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                      type="button"
                    >
                      Use This Prompt
                    </button>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a prompt from the list
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}