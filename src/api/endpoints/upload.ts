import { publicApi } from '@/api/api.ts';
import { AxiosProgressEvent } from 'axios';

export interface UploadResponse {
    url: string;
    key: string;
    bucket: string;
    filename: string;
    content_type: string;
    size: number;
}

export const uploadFileToMinio = async (
    file: File,
    options: {
        field_key: string;
        entity_type: "departments" | "events" | "event_payment_types";
        entity_id: string;
    },
    onProgress?: (progress: number) => void
): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('field_key', options.field_key);
    formData.append('entity_type', options.entity_type);
    formData.append('entity_id', options.entity_id);

    const response = await publicApi.post<UploadResponse>('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (onProgress && progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(progress);
            }
        },
    });

    return response.data;
};