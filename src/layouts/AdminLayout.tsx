import { FC, ReactNode } from "react";
import { SideBar } from "@/ui/SideBar.tsx";

interface AdminLayoutProps {
    children: ReactNode;
}

export const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <SideBar />
            <div className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8 overflow-x-hidden">{children}</div>
        </div>
    );
};
