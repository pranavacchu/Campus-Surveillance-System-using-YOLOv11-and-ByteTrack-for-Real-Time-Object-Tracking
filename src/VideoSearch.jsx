import React, { useState } from 'react';
import ApiConnection from './components/ApiConnection';
import VideoProcessor from './components/VideoProcessor';
import SearchInterface from './components/SearchInterface';
import './VideoSearch.css';

function VideoSearch() {
  const [isConnected, setIsConnected] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('search');

  const handleConnectionChange = (connected, healthData) => {
    setIsConnected(connected);
    setServerInfo(healthData);
  };

  return (
    <div className="video-search-page">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#888888" />
          </linearGradient>
          <linearGradient id="instructionsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#888888" />
          </linearGradient>
        </defs>
      </svg>

      <header className="page-header">
        <h1>
          <svg className="page-header-icon" viewBox="0 0 24 24">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          Video Search Engine
        </h1>
        <p className="subtitle">Powered by BLIP AI & Pinecone Vector Database (Colab GPU)</p>
      </header>

      <main className="page-main">
        {/* Connection Panel */}
        <ApiConnection onConnectionChange={handleConnectionChange} />

        {/* Navigation Tabs */}
        {isConnected && (
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              Search Videos
            </button>
            <button
              className={`tab-btn ${activeTab === 'process' ? 'active' : ''}`}
              onClick={() => setActiveTab('process')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Process Video
            </button>
          </div>
        )}

        {/* Tab Content */}
        {isConnected && (
          <div className="tab-content">
            {activeTab === 'search' && (
              <SearchInterface isConnected={isConnected} />
            )}
            {activeTab === 'process' && (
              <VideoProcessor isConnected={isConnected} />
            )}
          </div>
        )}

        {/* Instructions when not connected */}
        {!isConnected && (
          <div className="instructions-panel">
            <h2>
              <svg className="instructions-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Getting Started
            </h2>
            
            <div className="instruction-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Open Google Colab</h3>
                <p>Navigate to your Colab notebook with the video search engine</p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Add Server Cell</h3>
                <p>Add this code to a new cell in your notebook:</p>
                <pre className="code-block">
{`# Install required packages
!pip install fastapi uvicorn pyngrok nest-asyncio

# Import and start server
from colab_api_server import start_server_with_ngrok
start_server_with_ngrok()`}
                </pre>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Copy ngrok URL</h3>
                <p>The cell will output a public URL like:</p>
                <pre className="code-block">
{`🌍 Public URL: https://xxxx-xx-xxx-xxx-xx.ngrok-free.app`}
                </pre>
                <p>Copy this URL</p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Connect Above</h3>
                <p>Paste the URL in the "Colab API Connection" section above and click Connect</p>
              </div>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <h3>Process Videos</h3>
                <p>Upload videos and extract frames with AI-generated captions</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <h3>Semantic Search</h3>
                <p>Search videos using natural language queries</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h3>GPU Powered</h3>
                <p>Leverage Colab's free GPU for fast processing</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                  </svg>
                </div>
                <h3>Vector Database</h3>
                <p>Embeddings stored in Pinecone for instant retrieval</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="page-footer">
        <p>Built with React + FastAPI + BLIP + Pinecone</p>
        <p className="footer-status">
          {isConnected ? (
            <span className="status-connected">
              <span className="status-dot"></span>
              Connected to Colab
            </span>
          ) : (
            <span className="status-disconnected">
              <span className="status-dot"></span>
              Not Connected
            </span>
          )}
        </p>
      </footer>
    </div>
  );
}

export default VideoSearch;
