/**
 * Cloudinary Video Upload Service
 * Free tier: 25GB storage, 25GB bandwidth/month
 * No credit card required!
 */

class CloudinaryService {
  constructor() {
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    this.apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    
    console.log('✅ Cloudinary service initialized:', this.cloudName);
  }

  /**
   * Upload video to Cloudinary
   * Returns: { url, publicId, secureUrl, thumbnailUrl, duration, format, bytes }
   */
  async uploadVideo(file, onProgress) {
    if (!this.cloudName || !this.uploadPreset) {
      throw new Error('Cloudinary not configured. Check .env file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset); // unsigned upload (no signature needed)
    formData.append('folder', 'capstone-videos'); // organize in folder
    formData.append('resource_type', 'video');
    
    // Optional: Add tags for organization
    formData.append('tags', 'surveillance,capstone');

    console.log('📤 Uploading to Cloudinary...', {
      cloudName: this.cloudName,
      preset: this.uploadPreset,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
          console.log(`☁️ Cloudinary upload: ${percentComplete.toFixed(1)}%`);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          console.log('✅ Cloudinary upload successful!', {
            url: result.secure_url,
            publicId: result.public_id,
            duration: result.duration,
            format: result.format
          });

          resolve({
            url: result.secure_url, // HTTPS URL for video
            publicId: result.public_id, // Unique identifier
            secureUrl: result.secure_url,
            thumbnailUrl: this.getThumbnailUrl(result.public_id), // Auto-generated thumbnail
            duration: result.duration, // Video duration in seconds
            format: result.format, // Video format (mp4, etc.)
            bytes: result.bytes, // File size
            width: result.width,
            height: result.height,
            createdAt: result.created_at
          });
        } else {
          const error = xhr.responseText ? JSON.parse(xhr.responseText) : { message: xhr.statusText };
          console.error('❌ Cloudinary upload failed:', error);
          reject(new Error(`Upload failed: ${error.error?.message || xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        console.error('❌ Network error during Cloudinary upload');
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        console.warn('⚠️ Cloudinary upload aborted');
        reject(new Error('Upload aborted'));
      });

      // Cloudinary upload API (unsigned upload endpoint)
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`;
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  }

  /**
   * Get video URL with timestamp (for seeking to specific time)
   * Example: getVideoUrlAtTime('video123', 45) -> URL starting at 45 seconds
   */
  getVideoUrlAtTime(publicId, startTime) {
    // Cloudinary transformation: so_<seconds> = start offset
    return `https://res.cloudinary.com/${this.cloudName}/video/upload/so_${startTime}/${publicId}.mp4`;
  }

  /**
   * Generate thumbnail for video at specific time
   * @param {string} publicId - Cloudinary public ID
   * @param {number} timeInSeconds - Time offset for thumbnail (default: 0)
   */
  getThumbnailUrl(publicId, timeInSeconds = 0) {
    // Generate thumbnail at specific time with size constraints
    return `https://res.cloudinary.com/${this.cloudName}/video/upload/so_${timeInSeconds}/w_400,h_300,c_fill/${publicId}.jpg`;
  }

  /**
   * Get direct video URL (for video player)
   */
  getVideoUrl(publicId) {
    return `https://res.cloudinary.com/${this.cloudName}/video/upload/${publicId}.mp4`;
  }

  /**
   * Delete video from Cloudinary (admin only - requires signature)
   * Note: For production, this should be done server-side
   */
  async deleteVideo(publicId) {
    console.warn('⚠️ Delete operation requires server-side implementation for security');
    // This requires signature - implement on backend
    throw new Error('Delete operation must be implemented server-side');
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(publicId) {
    try {
      // Cloudinary Admin API - requires backend
      // For now, return basic info from public URL
      const url = this.getVideoUrl(publicId);
      return {
        publicId,
        url,
        thumbnailUrl: this.getThumbnailUrl(publicId)
      };
    } catch (error) {
      console.error('❌ Failed to get video metadata:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new CloudinaryService();
