import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import logoImage from './camera_logo_black.jpg';
import backgroundImage from './objects_ghibli.png';
import ApiConnection from './components/ApiConnection';
import VideoProcessor from './components/VideoProcessor';
import SearchInterface from './components/SearchInterface';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [detections, setDetections] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('webcam'); // webcam, search, process
  const [isColabConnected, setIsColabConnected] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const videoRef = useRef(null);
  const wsRef = useRef(null);

  const handleBack = () => {
    navigate('/');
  };

  const openModal = (modalName) => {
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const toggleWebcam = () => {
    if (isWebcamActive) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsWebcamActive(false);
    } else {
      startWebcam();
    }
  };

  const startWebcam = () => {
    setIsWebcamActive(true);
    wsRef.current = new WebSocket('ws://localhost:8000/ws');

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const img = new Image();
      img.src = `data:image/jpeg;base64,${data.frame}`;
      if (videoRef.current) {
        videoRef.current.src = img.src;
      }
      setDetections(data.detections);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsWebcamActive(false);
    };

    wsRef.current.onclose = () => {
      setIsWebcamActive(false);
    };
  };

  const handleConnectionChange = (connected, healthData) => {
    setIsColabConnected(connected);
    setServerInfo(healthData);
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-left">
          <button className="back-button" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="nav-brand">
            <img src={logoImage} alt="Logo" className="nav-logo-img" />
            <span className="nav-logo-text">SeekBot</span>
          </div>
        </div>
        <div className="nav-right">
          <div className="nav-links">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dataset'); }}>Datasets</a>
            <a href="#" onClick={(e) => { e.preventDefault(); openModal('features'); }}>Features</a>
            <a href="#" onClick={(e) => { e.preventDefault(); openModal('pricing'); }}>Pricing</a>
            <a href="#" onClick={(e) => { e.preventDefault(); openModal('customers'); }}>Customers</a>
            <a href="#" onClick={(e) => { e.preventDefault(); openModal('contact'); }}>Contact Us</a>
          </div>
        </div>
      </nav>

      <main className="dashboard-content">
        <h1 className="dashboard-title">MY DASHBOARD</h1>
        
        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <button 
            className={`dashboard-tab ${activeTab === 'webcam' ? 'active' : ''}`}
            onClick={() => setActiveTab('webcam')}
          >
            📹 Live Webcam
          </button>
          <button 
            className={`dashboard-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 Video Search
          </button>
          <button 
            className={`dashboard-tab ${activeTab === 'process' ? 'active' : ''}`}
            onClick={() => setActiveTab('process')}
          >
            📤 Process Video
          </button>
        </div>

        {/* Webcam Tab */}
        {activeTab === 'webcam' && (
          <div className="tab-panel">
            <button 
              className={`webcam-button ${isWebcamActive ? 'active' : ''}`}
              onClick={toggleWebcam}
            >
              <svg 
                className="camera-icon" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <span>{isWebcamActive ? 'Stop Webcam' : 'Start Webcam'}</span>
            </button>
            
            {isWebcamActive && (
              <div className="webcam-container">
                <img ref={videoRef} alt="Webcam feed" className="webcam-feed" />
                <div className="detections-list">
                  {detections.map((detection, index) => (
                    <div key={index} className="detection-item">{detection}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Video Search Tab */}
        {activeTab === 'search' && (
          <div className="tab-panel">
            <ApiConnection onConnectionChange={handleConnectionChange} />
            {isColabConnected ? (
              <SearchInterface isConnected={isColabConnected} />
            ) : (
              <div className="connection-instructions">
                <h2>🚀 Connect to Colab Backend</h2>
                <p>To use Video Search, you need to:</p>
                <ol>
                  <li>Open your Google Colab notebook</li>
                  <li>Run Cell 5 (the server cell with ngrok)</li>
                  <li>Copy the ngrok URL from the output</li>
                  <li>Paste it above and click "Connect"</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Process Video Tab */}
        {activeTab === 'process' && (
          <div className="tab-panel">
            <ApiConnection onConnectionChange={handleConnectionChange} />
            {isColabConnected ? (
              <VideoProcessor isConnected={isColabConnected} />
            ) : (
              <div className="connection-instructions">
                <h2>🚀 Connect to Colab Backend</h2>
                <p>To process videos, you need to:</p>
                <ol>
                  <li>Open your Google Colab notebook</li>
                  <li>Run Cell 5 (the server cell with ngrok)</li>
                  <li>Copy the ngrok URL from the output</li>
                  <li>Paste it above and click "Connect"</li>
                </ol>
              </div>
            )}
          </div>
        )}
        
        <img src={backgroundImage} alt="" className="dashboard-background" />
      </main>

      {/* Features Modal */}
      {activeModal === 'features' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Key Features</h2>
            <div className="modal-body">
              <div className="feature-item">
                <h3>Real-Time Monitoring</h3>
                <p>Advanced object detection and tracking for immediate threat identification.</p>
              </div>
              <div className="feature-item">
                <h3>Anomaly Detection</h3>
                <p>Detect unusual behavior patterns including sudden running and crowd formation.</p>
              </div>
              <div className="feature-item">
                <h3>Predictive Analytics</h3>
                <p>Historical pattern analysis for proactive threat prevention.</p>
              </div>
              <div className="feature-item">
                <h3>Instant Alerts</h3>
                <p>Real-time notification system for security personnel.</p>
              </div>
            </div>
            <button className="modal-close" aria-label="Close modal" onClick={closeModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {activeModal === 'pricing' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Pricing Plans</h2>
            <div className="modal-body">
              <div className="pricing-item">
                <h3>Basic Plan</h3>
                <ul>
                  <li>Real-time monitoring</li>
                  <li>Basic alert system</li>
                  <li>24/7 Support</li>
                  <li>Up to 5 cameras</li>
                </ul>
                <button className="plan-button">Contact Sales</button>
              </div>
              <div className="pricing-item featured">
                <h3>Professional Plan</h3>
                <ul>
                  <li>All Basic features</li>
                  <li>Anomaly detection</li>
                  <li>Pattern analysis</li>
                  <li>Up to 20 cameras</li>
                  <li>Priority support</li>
                </ul>
                <button className="plan-button">Contact Sales</button>
              </div>
              <div className="pricing-item">
                <h3>Enterprise Plan</h3>
                <ul>
                  <li>All Professional features</li>
                  <li>Custom integration</li>
                  <li>Unlimited cameras</li>
                  <li>Dedicated support team</li>
                </ul>
                <button className="plan-button">Contact Sales</button>
              </div>
            </div>
            <button className="modal-close" aria-label="Close modal" onClick={closeModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Customers Modal */}
      {activeModal === 'customers' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Our Customers</h2>
            <div className="modal-body customers-grid" aria-label="Customer segments">
              {/* Universities */}
              <div className="customer-item">
                <div className="customer-icon-wrap" aria-hidden="true">
                  <svg className="customer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10.5l9-6 9 6" />
                    <path d="M4.5 10.5h15" />
                    <path d="M7 10.5v7.5" />
                    <path d="M12 10.5v7.5" />
                    <path d="M17 10.5v7.5" />
                    <path d="M5.5 18h13" />
                    <path d="M4 20.5h16" />
                  </svg>
                </div>
                <h3>Universities</h3>
                <p>Protecting students and faculty across multiple campuses with state-of-the-art surveillance.</p>
              </div>

              {/* Colleges */}
              <div className="customer-item">
                <div className="customer-icon-wrap" aria-hidden="true">
                  <svg className="customer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l9-4 9 4-9 4-9-4z" />
                    <path d="M7 10v4c0 2 2.5 3.5 5 3.5s5-1.5 5-3.5v-4" />
                    <path d="M20 10v6" />
                  </svg>
                </div>
                <h3>Schools</h3>
                <p>Ensuring safety in educational environments with intelligent monitoring systems.</p>
              </div>

              {/* Research Institutes */}
              <div className="customer-item">
                <div className="customer-icon-wrap" aria-hidden="true">
                  <svg className="customer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 3v5l-4.2 7.4A3 3 0 0 0 8.4 20h7.2a3 3 0 0 0 2.6-4.6L14 8V3" />
                    <path d="M8 15c.9.8 2 .8 3 0s2-.8 3 0 2 .8 3 0" />
                  </svg>
                </div>
                <h3>Research Institutes</h3>
                <p>Securing valuable research facilities with advanced tracking capabilities.</p>
              </div>

              {/* Public Gatherings */}
              <div className="customer-item">
                <div className="customer-icon-wrap" aria-hidden="true">
                  <svg className="customer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="3" />
                    <path d="M6 19c0-3 4-5 6-5s6 2 6 5" />
                    <circle cx="6.5" cy="10" r="2" />
                    <circle cx="17.5" cy="10" r="2" />
                    <path d="M2.5 19c0-2 2.5-3.5 4.5-4" />
                    <path d="M21.5 19c0-2-2.5-3.5-4.5-4" />
                  </svg>
                </div>
                <h3>Public Gatherings</h3>
                <p>Enhancing safety and crowd management at stadiums, concerts, and public events with real-time monitoring.</p>
              </div>
            </div>
            <button className="modal-close" aria-label="Close modal" onClick={closeModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {activeModal === 'contact' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Contact Our Team</h2>
            <div className="modal-body">
              <div className="contact-item">
                <h3>Pranav Rao</h3>
                <p>
                  <svg className="contact-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
                  </svg>
                  +91 82177 09653
                </p>
                <a href="mailto:prao52623@gmail.com">
                  <svg className="contact-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  prao52623@gmail.com
                </a>
              </div>
              <div className="contact-item">
                <h3>Pranav Acharya</h3>
                <p>
                  <svg className="contact-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
                  </svg>
                  +91 7022939074
                </p>
                <a href="mailto:pranavacharya360@gmail.com">
                  <svg className="contact-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  pranavacharya360@gmail.com
                </a>
              </div>
              <div className="contact-item">
                <h3>Rishika N</h3>
                <p>
                  <svg className="contact-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
                  </svg>
                  +91 70198 25753
                </p>
                <a href="mailto:rishikanaarayan2003@gmail.com">
                  <svg className="contact-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  rishikanaarayan2003@gmail.com
                </a>
              </div>
              <div className="contact-item">
                <h3>Shreya Hegde</h3>
                <p>
                  <svg className="contact-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
                  </svg>
                  +91 76187 54280
                </p>
                <a href="mailto:shreya.m.hegde@gmail.com">
                  <svg className="contact-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  shreya.m.hegde@gmail.com
                </a>
              </div>
            </div>
            <button className="modal-close" aria-label="Close modal" onClick={closeModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 