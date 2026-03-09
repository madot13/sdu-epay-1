import { FC, useRef, useState } from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { uploadFileToMinio, UploadResponse } from "@/api/endpoints/upload.ts";

interface UploadOptions {
    field_key: string;
    entity_type: "departments" | "events" | "event_payment_types";
    entity_id: string;
}

interface FileUploadProps {
    onChange: (file: File | null, key?: string | undefined) => void;
    uploadOptions: UploadOptions;
    placeholder?: string;
    accept?: string;
    maxSize?: number;
}

export const FileUpload: FC<FileUploadProps> = ({
    onChange,
    uploadOptions,
    placeholder = "Выберите файл",
    accept = "*/*",
    maxSize = 20,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [fileName, setFileName] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        if (file.size > maxSize * 1024 * 1024) {
            alert(`Файл слишком большой. Максимальный размер: ${maxSize}MB`);
            return;
        }

        setFileName(file.name);
        setUploading(true);
        setUploadProgress(0);

        try {
            const uploadResponse: UploadResponse = await uploadFileToMinio(
                file,
                uploadOptions,
                (progress) => setUploadProgress(progress)
            );
            onChange(file, uploadResponse.key);
        } catch (error) {
            console.error("File upload error:", error);
            setFileName("");
            alert("Ошибка загрузки файла. Попробуйте ещё раз.");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleRemove = () => {
        setFileName("");
        onChange(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); }}
                className="hidden"
            />

            {!fileName ? (
                <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFileSelect(file); }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={!uploading ? () => fileInputRef.current?.click() : undefined}
                >
                    <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">{uploading ? "Загрузка..." : placeholder}</p>
                    {uploading && (
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
                        </div>
                    )}
                    <p className="text-xs text-gray-500">Макс. размер: {maxSize}MB</p>
                </div>
            ) : (
                <div className="border rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <CloudArrowUpIcon className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-700 truncate">{fileName}</span>
                    </div>
                    <button type="button" onClick={handleRemove} className="text-red-500 hover:text-red-700 text-sm">
                        Удалить
                    </button>
                </div>
            )}
        </div>
    );
};