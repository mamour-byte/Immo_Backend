import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Ensure cloudinary is configured as early as possible (helps when provider
// factory order is not guaranteed during module loading).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  // cast to any to avoid strict typings differences between package versions
  params: ({
    folder: 'properties',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'fill' }],
  } as unknown) as any,
});

export const agentApplicationsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: ({
    folder: 'agent-applications',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  } as unknown) as any,
});

export const asset3DStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: ({
    folder: 'assets3d',
    resource_type: 'auto',
    allowed_formats: ['glb', 'gltf', 'obj', 'fbx', 'dae'],
  } as unknown) as any,
});
