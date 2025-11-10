import React, { useState } from 'react';
import videoSearchService from '../services/videoSearchService';
import './VideoProcessor.css';

const VideoProcessor = ({ isConnected }) => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Video processing options
  const [videoName, setVideoName] = useState('');
  const [videoDate, setVideoDate] = useState(new Date().toISOString().split('T')[0]);
  const [useObjectDetection, setUseObjectDetection] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp4|avi|mov|mkv|webm)$/i)) {
        setError('Please select a valid video file (MP4, AVI, MOV, MKV, or WebM)');
        return;
      }

      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (selectedFile.size > maxSize) {
        setError('File too large. Maximum size is 500MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setUploadedFile(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a video file');
      return;
    }

    if (!isConnected) {
      setError('Not connected to Colab backend. Please connect first.');
      return;
    }

    try {
      setError(null);
      setUploadProgress(0);
      
      console.log('📤 Uploading video:', file.name);
      
      const uploadResult = await videoSearchService.uploadVideo(
        file,
        (progress) => setUploadProgress(progress)
      );
      
      setUploadedFile(uploadResult);
      setUploadProgress(100);
      console.log('✅ Upload complete:', uploadResult);
      
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
      console.error('Upload error:', err);
      setUploadProgress(0);
    }
  };

  const handleProcess = async () => {
    if (!uploadedFile) {
      setError('Please upload a video first');
      return;
    }

    try {
      setError(null);
      setProcessing(true);
      setProcessingStatus({ status: 'queued', progress: 'Starting...' });

      console.log('🎬 Starting video processing...');

      // Start processing
      const { job_id } = await videoSearchService.processVideo(
        uploadedFile.filename,
        {
          videoName: videoName || uploadedFile.original_filename,
          videoDate,
          useObjectDetection
        }
      );

      console.log(`📋 Processing job started: ${job_id}`);
      setProcessingStatus({ status: 'processing', progress: 'Processing video...' });

      // Poll for completion
      const processingResult = await videoSearchService.waitForJob(
        job_id,
        (status) => {
          console.log('Job status update:', status);
          setProcessingStatus(status);
        }
      );

      console.log('✅ Processing complete:', processingResult);
      setResult(processingResult);
      setProcessing(false);
      setProcessingStatus({ status: 'completed', progress: 'Complete!' });

    } catch (err) {
      setError(`Processing failed: ${err.message}`);
      console.error('Processing error:', err);
      setProcessing(false);
      setProcessingStatus(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadedFile(null);
    setUploadProgress(0);
    setProcessing(false);
    setProcessingStatus(null);
    setResult(null);
    setError(null);
    setVideoName('');
    setVideoDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="video-processor">
      <h2>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#processorGradient)" strokeWidth="2">
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
        Video Processor
      </h2>

      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="processorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#a8a8a8" />
          </linearGradient>
        </defs>
      </svg>

      {!isConnected && (
        <div className="warning-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Please connect to Colab backend first
        </div>
      )}

      {/* Step 1: File Selection */}
      <div className="processing-step">
        <h3>Step 1: Select Video</h3>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={processing || !isConnected}
          className="file-input"
        />
        {file && (
          <div className="file-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '6px'}}>
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
            {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
          </div>
        )}
      </div>

      {/* Step 2: Upload */}
      {file && !uploadedFile && (
        <div className="processing-step">
          <h3>Step 2: Upload to Colab</h3>
          <button
            onClick={handleUpload}
            disabled={processing || uploadProgress > 0}
            className="action-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Video
          </button>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                {uploadProgress.toFixed(0)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Configure Processing */}
      {uploadedFile && !result && (
        <div className="processing-step">
          <h3>Step 3: Configure Processing</h3>
          
          <div className="form-group">
            <label>Video Name (optional):</label>
            <input
              type="text"
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
              placeholder={uploadedFile.original_filename}
              disabled={processing}
              className="text-input"
            />
          </div>

          <div className="form-group">
            <label>Recording Date:</label>
            <input
              type="date"
              value={videoDate}
              onChange={(e) => setVideoDate(e.target.value)}
              disabled={processing}
              className="text-input"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={useObjectDetection}
                onChange={(e) => setUseObjectDetection(e.target.checked)}
                disabled={processing}
              />
              <span>Use Object Detection (slower, object-focused captions)</span>
            </label>
          </div>

          <button
            onClick={handleProcess}
            disabled={processing}
            className="action-btn primary"
          >
            {processing ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start Processing
              </>
            )}
          </button>
        </div>
      )}

      {/* Processing Status */}
      {processingStatus && (
        <div className="processing-step">
          <h3>Processing Status</h3>
          <div className={`status-box status-${processingStatus.status}`}>
            <div className="status-label">
              {processingStatus.status === 'completed' && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" style={{display: 'inline', marginRight: '6px'}}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Complete
                </>
              )}
              {processingStatus.status === 'processing' && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" style={{display: 'inline', marginRight: '6px'}}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Processing
                </>
              )}
              {processingStatus.status === 'queued' && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" style={{display: 'inline', marginRight: '6px'}}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  Queued
                </>
              )}
              {processingStatus.status === 'failed' && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{display: 'inline', marginRight: '6px'}}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  Failed
                </>
              )}
            </div>
            <div className="status-progress">
              {processingStatus.progress || processingStatus.status}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="processing-step">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" style={{display: 'inline', marginRight: '8px'}}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Processing Complete!
          </h3>
          <div className="results-grid">
            <div className="result-item">
              <span className="result-label">Frames Extracted:</span>
              <span className="result-value">{result.total_frames_extracted}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Frames with Captions:</span>
              <span className="result-value">{result.frames_with_captions}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Embeddings Generated:</span>
              <span className="result-value">{result.embeddings_generated}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Uploaded to Pinecone:</span>
              <span className="result-value">{result.embeddings_uploaded}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Processing Time:</span>
              <span className="result-value">
                {(result.processing_time_seconds / 60).toFixed(1)} minutes
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Frame Reduction:</span>
              <span className="result-value">
                {result.frame_reduction_percent.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <button onClick={handleReset} className="action-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Process Another Video
          </button>
        </div>
      )}

      {/* Error Display */}
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
  );
};

export default VideoProcessor;
