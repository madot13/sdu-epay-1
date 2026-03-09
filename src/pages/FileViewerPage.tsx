import {FC, useState} from "react";
import {CustomButton} from "@/ui/CustomButton.tsx";
import {SduReader} from "@/components/reader/SduReader.tsx";
import {DormReader} from "@/components/reader/DormReader.tsx";
import {AdminLayout} from "@/layouts/AdminLayout.tsx";

export const FileViewerPage:FC = () => {
    const [select, setSelect] = useState(0);
    const [testFiles, setTestFiles] = useState<Array<{name: string, url: string, type: string}>>([]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log("🔍 Uploaded file:", file);
            console.log("🔍 File type:", file.type);
            console.log("🔍 File size:", file.size);
            console.log("🔍 File name:", file.name);
            
            // Создаем blob URL для теста
            const url = URL.createObjectURL(file);
            setTestFiles(prev => [...prev, {
                name: file.name,
                url: url,
                type: file.type || 'unknown'
            }]);
        }
    };

    const testFileDownload = (url: string, fileName: string) => {
        console.log("🔍 Testing download for:", fileName);
        console.log("🔍 URL:", url);
        console.log("🔍 URL includes checks:", {
            hasHttp: url.includes("http"),
            hasHttps: url.includes("https"),
            hasBlob: url.includes("blob:")
        });

        try {
            if (url.includes("http") || url.includes("https")) {
                console.log("✅ Opening in new tab");
                window.open(url, '_blank');
            } else if (url.includes("blob:")) {
                console.log("✅ Creating download link");
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                console.log("✅ Download completed");
            } else {
                console.log("❌ Unknown URL type");
                alert("Неизвестный тип URL");
            }
        } catch (error) {
            console.error("❌ Download error:", error);
            alert("Ошибка при скачивании");
        }
    };

    return (
       <AdminLayout>
           <div className={"w-full"}>
               <div className="mb-6 lg:mb-0">
                   <p className="font-bold text-xl lg:text-[32px] mb-3 lg:mb-[20px]">Тестирование файлов</p>
                   <span className="text-base lg:text-[20px] font-light">
                      Загрузите файлы для тестирования скачивания и просмотра деталей.
                   </span>
               </div>

               {/* Тест загрузки файлов */}
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                   <h3 className="text-lg font-semibold mb-4">📁 Тест загрузки файлов</h3>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                               Выберите файл для загрузки:
                           </label>
                           <input
                               type="file"
                               onChange={handleFileUpload}
                               className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-blue-500"
                           />
                       </div>
                       
                       {testFiles.length > 0 && (
                           <div className="mt-4">
                               <h4 className="text-md font-medium mb-2">Загруженные файлы:</h4>
                               <div className="space-y-2">
                                   {testFiles.map((file, index) => (
                                       <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                           <div className="flex-1">
                                               <p className="font-medium">{file.name}</p>
                                               <p className="text-sm text-gray-500">Тип: {file.type}</p>
                                               <p className="text-xs text-gray-400 truncate">URL: {file.url}</p>
                                           </div>
                                           <CustomButton
                                               onClick={() => testFileDownload(file.url, file.name)}
                                               className="ml-4"
                                           >
                                               Скачать
                                           </CustomButton>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )}
                   </div>
               </div>

               {/* Старый функционал просмотра Excel */}
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                   <h3 className="text-lg font-semibold mb-4">📊 Просмотр Excel файлов</h3>
                   <div className={"flex flex-col sm:flex-row gap-3 lg:gap-5"}>
                       <CustomButton variant="submit" onClick={() => setSelect(1)} className="w-full sm:w-auto">SDU University</CustomButton>
                       <CustomButton variant="submit" onClick={() => setSelect(2)} className="w-full sm:w-auto">Dormitory</CustomButton>
                   </div>
                   <div className="mt-6">
                       {select === 1 && <SduReader />}
                       {select === 2 && <DormReader />}
                   </div>
               </div>
           </div>
       </AdminLayout>
    )
}