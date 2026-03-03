import {FC, useState} from "react";
import {CustomButton} from "@/ui/CustomButton.tsx";
import {SduReader} from "@/components/reader/SduReader.tsx";
import {DormReader} from "@/components/reader/DormReader.tsx";
import {AdminLayout} from "@/layouts/AdminLayout.tsx";

export const FileViewerPage:FC = () => {
    const [select, setSelect] = useState(0);
    return (
       <AdminLayout>
           <div className={"w-full"}>
               <div className="mb-6 lg:mb-0">
                   <p className="font-bold text-xl lg:text-[32px] mb-3 lg:mb-[20px]">Просмотр Excel файлов</p>
                   <span className="text-base lg:text-[20px] font-light">
                      Загрузите Excel-файл ниже, чтобы просмотреть детали транзакций. (Если возникли проблемы с отображением, попробуйте перезагрузить страницу)
                   </span>
               </div>
               <div className={"flex flex-col sm:flex-row gap-3 lg:gap-5 mt-6 lg:mt-[50px]"}>
                   <CustomButton variant="submit" onClick={() => setSelect(1)} className="w-full sm:w-auto">SDU University</CustomButton>
                   <CustomButton variant="submit" onClick={() => setSelect(2)} className="w-full sm:w-auto">Dormitory</CustomButton>
               </div>
               <div className="mt-6 lg:mt-8">
                   {select === 1 && <SduReader />}
                   {select === 2 && <DormReader />}
               </div>
           </div>
       </AdminLayout>
    )
}