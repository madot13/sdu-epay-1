import { FC } from "react";

export interface PaymentMethodItemProps {
    icon: string;
    name: string;
    selected?: boolean;
    onClick?: () => void;
    error?: string;
    disabled?: boolean;
}

export const PaymentMethodItem: FC<PaymentMethodItemProps> = ({ icon, name, selected, onClick, error, disabled }) => {
    return (
        <div
            onClick={!disabled ? onClick : undefined} // Disable onClick if disabled

            className={`cursor-pointer flex flex-col transition-colors gap-[10px] rounded-[5px] w-[202px] py-[15px] px-[21px]
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${selected ? 'border-2 border-[#6B9AB0] bg-[#EAF6FB]' : 'border border-[#D5D5D5] bg-[#F5F5F5]'} ${error ? ' border-red-500' : ''}`}
        >
            <div className={`border rounded-full  transition-colors p-1 w-fit ${selected ? 'border-[#6B9AB0]' : 'border-[#D5D5D5]'} ${error ? ' border-red-500' : ''}`}>
                <img src={icon} alt={name} className="w-[20px] h-[20px]" />
            </div>
            <p className="text-[16px]">{name}</p>
        </div>
    );
};
