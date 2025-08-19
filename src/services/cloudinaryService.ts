/**
 * Cloudinary Service for secure image upload and management
 * Handles avatar uploads with automatic optimization and transformations
 */

import { v2 as cloudinary } from 'cloudinary';
import logger from '../lib/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  success: boolean;
  publicId?: string;
  secureUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  error?: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  transformation?: Array<{
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  }>;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  publicId?: string;
  overwrite?: boolean;
  tags?: string[];
}

export class CloudinaryService {
  /**
   * Upload an image buffer to Cloudinary
   */
  static async uploadImage(
    buffer: Buffer,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      // Validate Cloudinary configuration
      if (!process.env.CLOUDINARY_CLOUD_NAME || 
          !process.env.CLOUDINARY_API_KEY || 
          !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary configuration is incomplete');
      }

      // Default options for avatar uploads
      const defaultOptions = {
        folder: 'mediport/avatars',
        resourceType: 'image' as const,
        transformation: [
          {
            width: 400,
            height: 400,
            crop: 'fill',
            quality: 'auto',
            format: 'webp',
          }
        ],
        overwrite: true,
        tags: ['avatar', 'profile', 'mediport'],
      };

      const uploadOptions = { ...defaultOptions, ...options };

      logger.info('Starting Cloudinary upload', {
        folder: uploadOptions.folder,
        resourceType: uploadOptions.resourceType,
        bufferSize: buffer.length,
      });

      // Convert buffer to base64 data URL
      const base64Data = `data:image/jpeg;base64,${buffer.toString('base64')}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(base64Data, uploadOptions);

      logger.info('Cloudinary upload successful', {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      });

      return {
        success: true,
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };

    } catch (error: any) {
      logger.error('Cloudinary upload failed', {
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message || 'Failed to upload image to Cloudinary',
      };
    }
  }

  /**
   * Upload avatar with specific optimizations
   */
  static async uploadAvatar(
    buffer: Buffer,
    userId: string,
    options: Partial<CloudinaryUploadOptions> = {}
  ): Promise<CloudinaryUploadResult> {
    const avatarOptions: CloudinaryUploadOptions = {
      folder: 'mediport/avatars',
      publicId: `user_${userId}_${Date.now()}`,
      transformation: [
        {
          width: 400,
          height: 400,
          crop: 'fill',
          quality: 'auto:good',
          format: 'webp',
        }
      ],
      overwrite: true,
      tags: ['avatar', 'profile', 'mediport', `user_${userId}`],
      ...options,
    };

    return this.uploadImage(buffer, avatarOptions);
  }

  /**
   * Delete an image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Deleting image from Cloudinary', { publicId });

      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok') {
        logger.info('Image deleted successfully', { publicId });
        return { success: true };
      } else {
        logger.warn('Image deletion failed', { publicId, result });
        return { success: false, error: `Deletion failed: ${result.result}` };
      }

    } catch (error: any) {
      logger.error('Error deleting image from Cloudinary', {
        publicId,
        error: error.message,
      });

      return {
        success: false,
        error: error.message || 'Failed to delete image from Cloudinary',
      };
    }
  }

  /**
   * Generate a transformation URL for an existing image
   */
  static generateTransformationUrl(
    publicId: string,
    transformations: Array<{
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
    }>
  ): string {
    try {
      return cloudinary.url(publicId, {
        transformation: transformations,
        secure: true,
      });
    } catch (error: any) {
      logger.error('Error generating transformation URL', {
        publicId,
        error: error.message,
      });
      return '';
    }
  }

  /**
   * Get optimized avatar URL with fallback
   */
  static getAvatarUrl(
    publicId: string,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): string {
    if (!publicId) return '';

    const sizeMap = {
      small: { width: 150, height: 150 },
      medium: { width: 400, height: 400 },
      large: { width: 800, height: 800 },
    };

    const dimensions = sizeMap[size];

    return this.generateTransformationUrl(publicId, [
      {
        width: dimensions.width,
        height: dimensions.height,
        crop: 'fill',
        quality: 'auto:good',
        format: 'webp',
      }
    ]);
  }

  /**
   * Validate image file before upload
   */
  static validateImageFile(buffer: Buffer, filename: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file size (5MB limit for Cloudinary)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSize) {
      errors.push(`File size too large. Maximum size is ${maxSize / 1024 / 1024}MB.`);
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
      errors.push(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
    }

    // Basic file header validation
    const header = buffer.slice(0, 4).toString('hex');
    const validHeaders = [
      'ffd8ff', // JPEG
      '89504e47', // PNG
      '47494638', // GIF
      '52494646', // WebP (RIFF)
    ];

    const isValidHeader = validHeaders.some(validHeader => 
      header.toLowerCase().startsWith(validHeader.toLowerCase())
    );

    if (!isValidHeader) {
      errors.push('Invalid image file format.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check Cloudinary configuration
   */
  static isConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }
}