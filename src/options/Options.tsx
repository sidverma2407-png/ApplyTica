import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, User, FileText, Settings, Sparkles, UploadCloud, Trash2, Check, AlertCircle } from 'lucide-react';
import type { UserProfile } from '../types';
import { getProfile, saveProfile, getApiKey, saveApiKey } from '../utils/storage';
import { extractTextFromFile, parseProfileFromText, calculateCompletion } from '../utils/parser';
import { parseResumeWithGemini } from '../utils/ai';

type Tab = 'dashboard' | 'profile' | 'resume' | 'settings';

const Options: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [apiKey, setApiKey] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProfile().then(p => setProfile(p || {}));
    getApiKey().then(k => setApiKey(k || ''));
  }, []);

  const handleSaveProfile = async () => {
    const updatedProfile = { 
      ...profile, 
      completionPercentage: calculateCompletion(profile),
      lastUpdated: Date.now() 
    } as UserProfile;
    
    await saveProfile(updatedProfile);
    setProfile(updatedProfile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveApiKey = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    await saveApiKey(val);
  };

  const handleClearProfile = async () => {
    if (confirm('Are you sure you want to clear your entire profile?')) {
      const emptyProfile = { completionPercentage: 0 } as UserProfile;
      await saveProfile(emptyProfile);
      setProfile({});
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const text = await extractTextFromFile(file);
      let parsedData;
      
      if (apiKey && apiKey.trim().length > 0) {
        parsedData = await parseResumeWithGemini(text, apiKey);
      } else {
        parsedData = parseProfileFromText(text);
      }
      
      const mergedProfile = { ...profile, ...parsedData };
      setProfile(mergedProfile);
      setActiveTab('profile'); // Switch to profile tab to edit
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'resume', label: 'Resume', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6 flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Applytica</h1>
        </div>
        
        <nav className="mt-6 px-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-10 max-w-4xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Profile Completion</h3>
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-4xl font-bold text-gray-900">{profile.completionPercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${profile.completionPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center text-center">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Ready to Apply</h3>
                  <p className="text-sm text-gray-500 mt-1">Your AI assistant is configured.</p>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
                <div className="flex gap-3">
                  <button 
                    onClick={handleClearProfile}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Clear
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {saveSuccess ? <Check className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    {saveSuccess ? 'Saved!' : 'Save Profile'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input type="text" name="firstName" value={profile.firstName || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input type="text" name="lastName" value={profile.lastName || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" name="email" value={profile.email || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="tel" name="phone" value={profile.phone || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input type="text" name="location" value={profile.location || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Links</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                      <input type="url" name="linkedin" value={profile.linkedin || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                      <input type="url" name="github" value={profile.github || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio / Website</label>
                      <input type="url" name="portfolio" value={profile.portfolio || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>

                {/* Extended Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Experience & Education</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Experience</label>
                      <textarea name="workExperience" rows={4} value={profile.workExperience || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-y"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                      <textarea name="education" rows={3} value={profile.education || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-y"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                      <textarea name="skills" rows={3} value={profile.skills || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-y"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Projects</label>
                      <textarea name="projects" rows={3} value={profile.projects || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-y"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                      <textarea name="certifications" rows={2} value={profile.certifications || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-y"></textarea>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'resume' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Resume</h2>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  className="hidden" 
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-dashed border-2 rounded-xl p-12 cursor-pointer transition-colors ${isUploading ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}
                >
                  {isUploading ? (
                    <div className="animate-pulse">
                      <Sparkles className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {apiKey && apiKey.trim().length > 0 ? 'AI is analyzing your resume...' : 'Analyzing Resume...'}
                      </h3>
                      <p className="text-gray-500">Extracting your profile information.</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload your resume</h3>
                      <p className="text-gray-500 mb-6">Drag and drop or click to browse</p>
                      <div className="flex gap-3 justify-center">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">PDF</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">DOCX</span>
                      </div>
                    </>
                  )}
                </div>

                {uploadError && (
                  <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{uploadError}</span>
                  </div>
                )}
                
                <p className="mt-6 text-sm text-gray-500">
                  Uploading a new resume will automatically extract and populate your profile fields. You can review and edit them in the <strong>My Profile</strong> tab.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Settings</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-4 mb-4">Extension Preferences</h3>
                <div className="space-y-4 mb-8">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <span className="text-gray-700">Show floating button on job boards</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                    <span className="text-gray-700">Auto-detect application forms</span>
                  </label>
                </div>

                <h3 className="text-lg font-medium text-gray-900 border-b pb-4 mb-4">AI Configuration</h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-2">Provide a Gemini API Key to enable perfectly accurate resume extraction and highly intelligent form field mapping.</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                    <input 
                      type="password" 
                      value={apiKey} 
                      onChange={handleSaveApiKey} 
                      placeholder="AIzaSy..." 
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none max-w-md" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Options;
