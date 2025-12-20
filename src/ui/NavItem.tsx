import {FC} from "react";
import {NavLink} from "react-router-dom";


interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    to: string;
    isCollapsed?: boolean;
}

export const NavItem: FC<NavItemProps> = ({ icon, label, to, onClick, isCollapsed = false}) => {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            title={isCollapsed ? label : undefined}
            className={({ isActive }) =>
                `flex items-center gap-2 lg:gap-3 p-2 rounded-md transition-colors text-sm lg:text-base ${
                    isActive ? "bg-[#005B88]" : "hover:bg-[#005B88]"
                } ${isCollapsed ? "justify-center" : ""}`
            }
        >
            {icon}
            {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
        </NavLink>
    );
};