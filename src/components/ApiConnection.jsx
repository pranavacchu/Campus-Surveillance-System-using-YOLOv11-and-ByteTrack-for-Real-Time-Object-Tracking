import React, { useState, useEffect } from 'react';
import videoSearchService from '../services/videoSearchService';
import './ApiConnection.css';

const ApiConnection = ({ onConnectionChange }) => {
  const [apiUrl, setApiUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState(null);

  // Try to load saved URL from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem('colab_api_url');
    if (savedUrl) {
      setApiUrl(savedUrl);
      // Auto-connect if URL exists
      testConnectionWithUrl(savedUrl);
    }
  }, []);

  const testConnectionWithUrl = async (url) => {
    setIsConnecting(true);
    setError(null);

    try {
      videoSearchService.setApiUrl(url);
      const result = await videoSearchService.testConnection();
      
      setIsConnected(result.connected);
      setHealthData(result.data);
      
      // Save URL to localStorage
      localStorage.setItem('colab_api_url', url);
      
      if (onConnectionChange) {
        onConnectionChange(result.connected, result.data);
      }
    } catch (err) {
      setIsConnected(false);
      setError(err.message);
      setHealthData(null);
      
      if (onConnectionChange) {
        onConnectionChange(false, null);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    
    if (!apiUrl.trim()) {
      setError('Please enter an API URL');
      return;
    }

    await testConnectionWithUrl(apiUrl.trim());
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setHealthData(null);
    setError(null);
    localStorage.removeItem('colab_api_url');
    
    if (onConnectionChange) {
      onConnectionChange(false, null);
    }
  };

  return (
    <div className="api-connection">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#a8a8a8" />
          </linearGradient>
        </defs>
      </svg>

      <h2>
        <svg className="connection-icon" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        Colab API Connection
      </h2>
      
      {!isConnected ? (
        <div className="connection-form">
          <p className="instructions">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Enter the ngrok URL from your Colab notebook:
          </p>
          
          <form onSubmit={handleConnect}>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://xxxx-xx-xxx-xxx-xx.ngrok-free.app"
              className="url-input"
              disabled={isConnecting}
            />
            
            <button 
              type="submit" 
              className="connect-btn"
              disabled={isConnecting || !apiUrl.trim()}
            >
              {isConnecting ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  Connect
                </>
              )}
            </button>
          </form>

          <div className="instructions-detail">
            <h4>How to get the URL:</h4>
            <ol>
              <li>Open your Google Colab notebook</li>
              <li>Run the server cell: <code>start_server_with_ngrok()</code></li>
              <li>Copy the ngrok URL that appears</li>
              <li>Paste it above and click Connect</li>
            </ol>
          </div>

          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="connection-status">
          <div className="status-header">
            <div className="status-indicator connected">
              <span className="pulse"></span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Connected
            </div>
            <button onClick={handleDisconnect} className="disconnect-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Disconnect
            </button>
          </div>

          {healthData && (
            <div className="health-info">
              <h4>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Server Status:
              </h4>
              <div className="health-grid">
                <div className="health-item">
                  <span className="label">Engine:</span>
                  <span className="value">
                    {healthData.engine_initialized ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Ready
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Not Ready
                      </>
                    )}
                  </span>
                </div>
                <div className="health-item">
                  <span className="label">GPU:</span>
                  <span className="value">
                    {healthData.gpu_available ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {healthData.gpu_name}
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        CPU Mode
                      </>
                    )}
                  </span>
                </div>
                <div className="health-item">
                  <span className="label">API URL:</span>
                  <span className="value url-display">{apiUrl}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiConnection;
