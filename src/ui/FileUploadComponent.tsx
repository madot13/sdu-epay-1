import { FC, useRef, useState } from "react";
import { CloudArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline";

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
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                        isDragging
                            ? "border-[#6B9AB0] bg-[#F0F7FA]"
                            : "border-gray-300 hover:border-[#6B9AB0] hover:bg-gray-50"
                    } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={!uploading ? handleClick : undefined}
                >
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-[#6B9AB0]" />
                    <p className="mt-3 text-sm font-medium text-gray-700">
                        {uploading ? "Загрузка..." : placeholder}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Макс. размер: {maxSize}MB
                    </p>
                    <p className="text-xs text-[#6B9AB0] mt-2 font-medium">
                        Нажмите или перетащите файл сюда
                    </p>
                </div>
            ) : (
                <div className="border border-[#6B9AB0] rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <CloudArrowUpIcon className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {fileName}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Файл загружен
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemove}
                            className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
