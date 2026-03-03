import { FC, useRef, useState } from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";

interface FileUploadProps {
    onChange: (file: File | null, url?: string) => void;
    placeholder?: string;
    accept?: string;
    maxSize?: number;
}

export const FileUpload: FC<FileUploadProps> = ({
    onChange,
    placeholder = "Выберите файл",
    accept = "*/*",
    maxSize = 10
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        if (file.size > maxSize * 1024 * 1024) {
            alert(`Файл слишком большой. Максимальный размер: ${maxSize}MB`);
            return;
        }

        setFileName(file.name);
        setUploading(true);

        try {
            const url = URL.createObjectURL(file);
            onChange(file, url);
        } catch (error) {
            console.error("File upload error:", error);
            alert("Ошибка загрузки файла");
        } finally {
            setUploading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemove = () => {
        setFileName("");
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleInputChange}
                className="hidden"
            />
            
            {!fileName ? (
                <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        isDragging
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-gray-400"
                    } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={!uploading ? handleClick : undefined}
                >
                    <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                        {uploading ? "Загрузка..." : placeholder}
                    </p>
                    <p className="text-xs text-gray-500">
                        Макс. размер: {maxSize}MB
                    </p>
                </div>
            ) : (
                <div className="border rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <CloudArrowUpIcon className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-700 truncate">{fileName}</span>
                    </div>
                    <button
                        onClick={handleRemove}
                        className="text-red-500 hover:text-red-700 text-sm"
                    >
                        Удалить
                    </button>
                </div>
            )}
        </div>
    );
};
