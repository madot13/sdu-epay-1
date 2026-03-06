import { publicApi } from '@/api';
import { AxiosProgressEvent } from 'axios';

export interface UploadResponse {
    url: string;
    filename: string;
    size: number;
    content_type: string;
}

export const uploadFile = async (
    file: File,
    onProgress?: (progress: number) => void
): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await publicApi.post<UploadResponse>('/upload/public', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
        });

        return response.data;
    } catch (error) {
        console.error('Upload error:', error);
        throw new Error('Failed to upload file');
    }
};

export const uploadFileToMinio = async (
    file: File,
    folder?: string,
    onProgress?: (progress: number) => void
): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
        formData.append('folder', folder);
    }

    try {
        const response = await publicApi.post<UploadResponse>('/upload/minio', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
        });

        return response.data;
    } catch (error) {
        console.error('MinIO upload error:', error);
        throw new Error('Failed to upload file to MinIO');
    }
};
