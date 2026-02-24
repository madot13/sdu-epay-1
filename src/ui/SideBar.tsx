import { FC, useState } from "react";
import { NavItem } from "@/ui/NavItem.tsx";
import {
    ArrowLeftStartOnRectangleIcon,
    BriefcaseIcon,
    CalendarIcon,
    ChartBarIcon,
    ReceiptPercentIcon,
    TableCellsIcon,
    UserIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { clearTokens } from "@/api/utils/tokenUtils.ts";
import { useUserData } from "@/hooks/useUserData.ts";
import { useSidebar } from "@/contexts/SidebarContext.tsx";
import { FileTextIcon } from "lucide-react";
const navItems = [
    {
        label: "Панель управления",
        to: "/dashboard",
        icon: <ChartBarIcon width={20} />,
        roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    },
    {
        label: "Пользователи",
        to: "/admin",
        icon: <UserIcon width={20} />,
        roles: ["SUPER_ADMIN"],
    },
    {
        label: "Департаменты",
        to: "/departments",
        icon: <BriefcaseIcon width={20} />,
        roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
        label: "События",
        to: "/events",
        icon: <CalendarIcon width={20} />,
        roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
    },
    {
        label: "Промокоды",
        to: "/promo-codes",
        icon: <ReceiptPercentIcon width={20} />,
        roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    },
    {
        label: "Заказы",
        to: "/orders",
        icon: <ShoppingCartIcon width={20} />,
        roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    },
    {
        label: 'Пакеты для событий',
        to: '/admin/packet-events', // Было '/packet-events', а в App.tsx у тебя '/admin/packet-events'
        icon: <FileTextIcon />,
        roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
        label: "Чтение файлов",
        to: "/file-reader",
        icon: <TableCellsIcon width={20} />,
        roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
    },
];


export const SideBar: FC = () => {
    const user = useUserData();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isCollapsed, toggleSidebar } = useSidebar();

    const filteredItems = navItems.filter(
        (item) => !user?.role || item.roles.includes(user.role)
    );

    return (
        <>
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#006799] text-white rounded-md"
            >
                {isMobileMenuOpen ? (
                    <XMarkIcon width={24} height={24} />
                ) : (
                    <Bars3Icon width={24} height={24} />
                )}
            </button>

            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/20 bg-opacity-50 z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky lg:top-0 h-screen lg:min-h-screen bg-[#006799] text-white flex flex-col z-40 transform transition-all duration-300 ${
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                } ${
                    isCollapsed ? "w-20" : "w-64"
                }`}
            >
                <div className={`p-6 text-2xl font-bold border-b border-[#00547C] flex-shrink-0 flex items-center ${isCollapsed ? "justify-center px-2 relative" : "justify-between"}`}>
                    {!isCollapsed ? (
                        <>
                            <img src="logo-2.png" alt="logo" className="max-md:mt-10 lg:w-auto" />
                            <button
                                onClick={toggleSidebar}
                                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#005B88] transition-colors"
                                title="Свернуть меню"
                            >
                                <ChevronLeftIcon width={20} height={20} />
                            </button>
                        </>
                    ) : (
                        <>
                            <img src="logo-3.png" alt="logo" className="w-8 h-8 max-md:mt-10" />
                            <button
                                onClick={toggleSidebar}
                                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#005B88] transition-colors absolute top-2 right-2"
                                title="Развернуть меню"
                            >
                                <ChevronRightIcon width={20} height={20} />
                            </button>
                        </>
                    )}
                </div>
                <nav className="flex flex-col flex-1 p-4 overflow-y-auto">
                    <div className="space-y-2 flex-1">
                        {filteredItems.map((item) => (
                        <NavItem
                            key={item.to}
                            icon={item.icon}
                            label={item.label}
                            to={item.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            isCollapsed={isCollapsed}
                        />
                        ))}
                    </div>
                    <div className="pt-4 border-t border-[#00547C] mt-auto flex-shrink-0">
                        {!isCollapsed && (
                            <div className="flex items-center gap-4 mb-4 px-2">
                                <div className="bg-white p-2 rounded-full shadow-md flex-shrink-0">
                                    <UserIcon width={40} height={40} color="#006799" />
                                </div>
                                <div className="text-sm min-w-0">
                                    <p className="font-semibold truncate">{user?.name ?? "Unknown User"}</p>
                                    <p className="text-gray-200 truncate">{user?.username}</p>
                                    <p className="text-gray-300 text-xs capitalize">Role: {user?.role?.toLowerCase()}</p>
                                </div>
                            </div>
                        )}
                        {isCollapsed && (
                            <div className="flex items-center justify-center mb-4">
                                <div className="bg-white p-2 rounded-full shadow-md">
                                    <UserIcon width={24} height={24} color="#006799" />
                                </div>
                            </div>
                        )}
                        <NavItem
                            icon={<ArrowLeftStartOnRectangleIcon width={20} />}
                            label="Выйти"
                            to="/login"
                            onClick={() => {
                                clearTokens();
                                setIsMobileMenuOpen(false);
                            }}
                            isCollapsed={isCollapsed}
                        />
                    </div>
            </nav>
        </aside>
        </>
    );
};
