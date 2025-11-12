/**
 * Video Search Service
 * Handles all API communication with the Colab backend
 * Now includes Cloudinary for cloud video hosting
 */

import cloudinaryService from './cloudinaryService';

class VideoSearchService {
  constructor() {
    // API base URL - will be set dynamically or from environment
    this.apiBaseUrl = null;
    this.isConnected = false;
  }

  /**
   * Set the API URL (from ngrok or local server)
   */
  setApiUrl(url) {
    // Remove trailing slash if present
    this.apiBaseUrl = url.replace(/\/$/, '');
    this.isConnected = false;
    console.log(`🔗 API URL set to: ${this.apiBaseUrl}`);
  }

  /**
   * Get the current API URL
   */
  getApiUrl() {
    return this.apiBaseUrl;
  }

  /**
   * Check if API URL is configured
   */
  isConfigured() {
    return this.apiBaseUrl !== null && this.apiBaseUrl !== '';
  }

  /**
   * Test connection to the API
   */
  async testConnection() {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',  // Skip ngrok warning page
          'User-Agent': 'VideoSearchApp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Make sure the Colab server is running and you copied the correct ngrok URL.');
      }

      const data = await response.json();
      this.isConnected = data.status === 'healthy';
      
      return {
        success: true,
        connected: this.isConnected,
        data: data
      };
    } catch (error) {
      this.isConnected = false;
      // Better error message for common issues
      if (error.message.includes('JSON')) {
        throw new Error('Connection failed: Server returned HTML instead of JSON. Please make sure:\n1. Cell 5 is running in Colab\n2. You copied the complete ngrok URL\n3. Try clicking the ngrok URL in Colab first to clear the warning');
      }
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  /**
   * Get server and GPU status
   */
  async getHealth() {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/health`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'VideoSearchApp/1.0'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch health status');
    return await response.json();
  }

  /**
   * Get Pinecone index statistics
   */
  async getStats() {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/stats`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'VideoSearchApp/1.0'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
  }

  /**
   * Get available dates with videos
   */
  async getAvailableDates() {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/dates`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'VideoSearchApp/1.0'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch dates');
    return await response.json();
  }

  /**
   * Upload video file to Colab
   */
  async uploadVideo(file, onProgress) {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.detail || `Upload failed: ${xhr.statusText}`));
          } catch (e) {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed: Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      xhr.open('POST', `${this.apiBaseUrl}/api/upload`);
      xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
      xhr.setRequestHeader('User-Agent', 'VideoSearchApp/1.0');
      xhr.send(formData);
    });
  }

  /**
   * Upload video to Cloudinary + Colab (Enhanced with cloud storage)
   * Returns: { videoId, cloudinaryUrl, cloudinaryPublicId, colabFilename, originalFilename, thumbnailUrl }
   */
  async uploadVideoWithCloud(file, onProgress, videoName = null) {
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let cloudinaryUrl = null;
    let cloudinaryPublicId = null;
    let thumbnailUrl = null;
    let colabResult = null;
    
    console.log('📤 Starting dual upload pipeline (Cloudinary + Colab)...');

    // Step 1: Upload to Cloudinary (0-50%)
    try {
      console.log('☁️ Uploading to Cloudinary...');
      
      // Use user-provided video name as Cloudinary public_id
      const uploadOptions = {};
      if (videoName) {
        // Sanitize video name for Cloudinary (alphanumeric, hyphens, underscores only)
        const sanitizedName = videoName.replace(/[^a-zA-Z0-9_-]/g, '_');
        uploadOptions.publicId = sanitizedName;
        console.log(`Using custom public_id: ${sanitizedName}`);
      }
      
      const cloudResult = await cloudinaryService.uploadVideo(file, (progress) => {
        onProgress?.({ stage: 'cloudinary', progress: progress * 0.5 });
      }, uploadOptions);
      
      cloudinaryUrl = cloudResult.secureUrl;
      cloudinaryPublicId = cloudResult.publicId;
      thumbnailUrl = cloudResult.thumbnailUrl;
      console.log('✅ Cloudinary upload successful!');
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary upload failed:', cloudinaryError.message);
      console.log('⚡ Will continue with Colab-only mode...');
      cloudinaryUrl = null;
    }

    // Step 2: ALWAYS upload to Colab for processing (50-100% or 0-100% if Cloudinary failed)
    try {
      console.log('🚀 Uploading to Colab for processing...');
      colabResult = await this.uploadVideo(file, (progress) => {
        // Adjust progress based on whether Cloudinary succeeded
        const adjustedProgress = cloudinaryUrl ? 50 + (progress * 0.5) : progress;
        onProgress?.({ stage: 'colab', progress: adjustedProgress });
      });
      console.log('✅ Colab upload successful!');
    } catch (colabError) {
      console.error('❌ CRITICAL: Colab upload failed:', colabError.message);
      throw new Error(`Colab upload failed: ${colabError.message}`);
    }

    console.log('✅ Complete upload pipeline finished');

    return {
      videoId,
      cloudinaryUrl,
      cloudinaryPublicId,
      thumbnailUrl,
      colabFilename: colabResult.filename,
      originalFilename: file.name
    };
  }
  /**
   * Start video processing
   */
  async processVideo(videoFilename, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(
      `${this.apiBaseUrl}/api/process?video_filename=${encodeURIComponent(videoFilename)}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'VideoSearchApp/1.0'
        },
        body: JSON.stringify({
          video_name: options.videoName,
          video_date: options.videoDate,
          video_id: options.videoId,
          cloudinary_url: options.cloudinaryUrl,
          save_frames: options.saveFrames || false,
          upload_to_pinecone: options.uploadToPinecone !== false,
          use_object_detection: options.useObjectDetection || false
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Processing failed');
    }

    return await response.json();
  }

  /**
   * Check job status
   */
  async getJobStatus(jobId) {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/job/${jobId}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'VideoSearchApp/1.0'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch job status');
    return await response.json();
  }

  /**
   * Poll job status until complete
   */
  async waitForJob(jobId, onUpdate, pollInterval = 2000) {
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        try {
          const status = await this.getJobStatus(jobId);
          
          if (onUpdate) onUpdate(status);

          if (status.status === 'completed') {
            clearInterval(intervalId);
            
            // Update Firestore if videoId exists
            if (status.video_id) {
              try {
                await updateDoc(doc(db, 'videos', status.video_id), {
                  processed: true,
                  processing: false,
                  processedAt: new Date().toISOString(),
                  processingResult: status.result
                });
              } catch (error) {
                console.warn('Failed to update Firestore after completion:', error);
              }
            }
            
            resolve(status.result);
          } else if (status.status === 'failed') {
            clearInterval(intervalId);
            
            // Update Firestore if videoId exists
            if (status.video_id) {
              try {
                await updateDoc(doc(db, 'videos', status.video_id), {
                  processing: false,
                  processingFailed: true,
                  processingError: status.error,
                  failedAt: new Date().toISOString()
                });
              } catch (error) {
                console.warn('Failed to update Firestore after failure:', error);
              }
            }
            
            reject(new Error(status.error || 'Processing failed'));
          }
        } catch (error) {
          clearInterval(intervalId);
          reject(error);
        }
      }, pollInterval);
    });
  }

  /**
   * List all jobs
   */
  async listJobs() {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/jobs`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'VideoSearchApp/1.0'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch jobs');
    return await response.json();
  }

  /**
   * Search videos
   */
  async search(query, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/search`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'VideoSearchApp/1.0'
      },
      body: JSON.stringify({
        query,
        top_k: options.topK || 10,
        similarity_threshold: options.similarityThreshold || 0.5,
        video_filter: options.videoFilter,
        date_filter: options.dateFilter,
        namespace_filter: options.namespaceFilter
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Search failed');
    }

    return await response.json();
  }

  /**
   * Search by date range
   */
  async searchByDateRange(query, startDate, endDate, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/search/daterange`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'VideoSearchApp/1.0'
      },
      body: JSON.stringify({
        query,
        start_date: startDate,
        end_date: endDate,
        top_k: options.topK || 10,
        similarity_threshold: options.similarityThreshold || 0.5,
        namespace_filter: options.namespaceFilter
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Search failed');
    }

    return await response.json();
  }

  /**
   * Batch search
   */
  async batchSearch(queries, topK = 5) {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/search/batch`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'VideoSearchApp/1.0'
      },
      body: JSON.stringify({ queries, top_k: topK })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Batch search failed');
    }

    return await response.json();
  }

  /**
   * Clear Pinecone index
   */
  async clearIndex() {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/clear`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'VideoSearchApp/1.0'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to clear index');
    }

    return await response.json();
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId) {
    if (!this.isConfigured()) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/job/${jobId}`, {
      method: 'DELETE',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'VideoSearchApp/1.0'
      }
    });

    if (!response.ok) throw new Error('Failed to delete job');
    return await response.json();
  }
}

// Export singleton instance
export default new VideoSearchService();
