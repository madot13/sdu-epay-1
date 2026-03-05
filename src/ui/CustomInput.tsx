import { FC, ReactNode } from "react";

export type InputProps = {
    className?: string;
    icon?: ReactNode;
    placeholder?: string;
    type?: string;
    value?: any;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    disabled?: boolean;
};

export const CustomInput: FC<InputProps> = ({
    className,
    icon,
    placeholder = "Enter text",
    type = "text",
    value,
    onChange,
    error,
    disabled = false,
}) => {
    return (
        <div className="relative">
            {icon && (
                <div>
                    <div className="w-[20px] h-[20px] flex absolute top-[50%] left-[20px] transform -translate-y-1/2">
                        {icon}
                        <div className={"relative"}>
                            <div className={`absolute flex top-[-4px] left-[5px] w-[1px] h-[30px] bg-[#6B9AB0] mx-2 ${error ? 'bg-red-500' : ''} `}></div>
                        </div>
                    </div>
                </div>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`bg-[#F3F3F3] border border-[#6B9AB0] rounded-[5px] ring-[#6B9AB0] p-[13px] pl-[65px] w-full ${className}  ${error ? 'border-red-500' : ''}`}
            />
        </div>
    );
};
