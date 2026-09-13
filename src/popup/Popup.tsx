import React, { useEffect, useState } from 'react';
import type { UserProfile, MappingResult } from '../types';
import { getProfile } from '../utils/storage';
import { Settings, Sparkles, ExternalLink, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';

type PopupState = 'idle' | 'scanning' | 'preview' | 'filling' | 'done';

const Popup: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appState, setAppState] = useState<PopupState>('idle');
  const [mappings, setMappings] = useState<MappingResult[]>([]);
  const [fillStats, setFillStats] = useState({ filledCount: 0, reviewCount: 0 });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
    });
  }, []);

  const handleScan = async () => {
    if (!profile) {
      setErrorMsg('Please complete your profile first.');
      return;
    }

    setAppState('scanning');
    setErrorMsg('');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'SCAN_FORMS', profile }, (response) => {
          if (chrome.runtime.lastError) {
            setErrorMsg('Cannot access this page.');
            setAppState('idle');
            return;
          }
          if (response && response.success && response.mappings) {
            setMappings(response.mappings);
            setAppState('preview');
          } else {
            setErrorMsg('No forms detected.');
            setAppState('idle');
          }
        });
      }
    } catch (e) {
      setErrorMsg('Error scanning page.');
      setAppState('idle');
    }
  };

  const handleFill = async () => {
    setAppState('filling');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'FILL_FORM', mappings }, (response) => {
          if (chrome.runtime.lastError) {
            setErrorMsg('Connection to page lost.');
            setAppState('preview');
            return;
          }
          if (response && response.success) {
            setFillStats({
              filledCount: response.filledCount,
              reviewCount: response.reviewCount
            });
            setAppState('done');
          } else {
            setErrorMsg('Failed to fill form.');
            setAppState('preview');
          }
        });
      }
    } catch (e) {
      setErrorMsg('Error filling form.');
      setAppState('preview');
    }
  };

  const openDashboard = () => {
    chrome.runtime.openOptionsPage();
  };

  const completionPercentage = profile?.completionPercentage || 0;

  return (
    <div className="flex flex-col h-[500px] bg-white p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Applytica</h1>
        </div>
        <button 
          onClick={openDashboard}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        {/* State: Idle / Done */}
        {(appState === 'idle' || appState === 'done') && (
          <>
            {/* Profile Status */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              {completionPercentage < 100 && (
                <button 
                  onClick={openDashboard}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  Complete your profile <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {appState === 'done' && (
              <div className="mb-4 bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">{fillStats.filledCount} fields filled successfully</h3>
                {fillStats.reviewCount > 0 && (
                  <p className="text-sm text-yellow-600 mt-1">{fillStats.reviewCount} fields need review</p>
                )}
              </div>
            )}
            
            {errorMsg && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">
                {errorMsg}
              </div>
            )}
          </>
        )}

        {/* State: Preview */}
        {appState === 'preview' && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Applytica detected {mappings.length} fields</h3>
            <div className="space-y-2">
              {mappings.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm">
                  <span className="font-medium text-gray-700 truncate max-w-[120px]">{m.detectedLabel || 'Unknown'}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mx-1" />
                  {m.confidence === 'high' ? (
                    <span className="text-green-600 flex items-center gap-1 truncate font-medium">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> {m.mappedProfileKey}
                    </span>
                  ) : (
                    <span className="text-yellow-600 flex items-center gap-1 truncate text-xs font-medium">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" /> Needs review
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="pt-4 mt-auto border-t border-gray-100 bg-white flex-shrink-0">
        {appState === 'idle' || appState === 'done' || appState === 'scanning' ? (
          <button
            onClick={handleScan}
            disabled={appState === 'scanning'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            {appState === 'scanning' ? 'Scanning...' : 'Scan Form'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setAppState('idle')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleFill}
              disabled={appState === 'filling'}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {appState === 'filling' ? 'Filling...' : 'Fill Form'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
