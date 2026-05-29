// src/lib/cloudinary/upload.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

interface SignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export async function uploadToCloudinary(
  file: File,
  folder: 'kyc' | 'products' | 'chat'
): Promise<string> {
  // 1. Obtener firma del servidor
  const getSignature = httpsCallable<{ folder: string }, SignatureResponse>(
    functions,
    'getCloudinarySignature'
  );
  
  const { data } = await getSignature({ folder: `cubax/${folder}` });
  
  // 2. Subir imagen con firma
  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', data.signature);
  formData.append('timestamp', data.timestamp.toString());
  formData.append('api_key', data.apiKey);
  formData.append('folder', data.folder);
  formData.append('upload_preset', 'cubax_signed');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const result = await response.json();
  return result.secure_url;
}