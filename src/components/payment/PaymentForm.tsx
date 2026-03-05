import {FC, useEffect, useState} from "react";
import { CustomInput } from "../../ui/CustomInput.tsx";
import {EnvelopeIcon, PhoneIcon, UserIcon, CurrencyDollarIcon} from "@heroicons/react/24/outline";
import {CustomSelect, Option} from "../../ui/CustomSelect.tsx";
import { PaymentMethod } from "./PaymentMethod.tsx";
import { PromocodeInput } from "./PromocodeInput.tsx";
import { CustomButton } from "../../ui/CustomButton.tsx";
import { CheckOut } from "./CheckOut.tsx";
import {useForm, Controller, SubmitHandler} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { PulseLoader } from "react-spinners";
import {getPublicDepartments} from "@/api/endpoints/departments.ts";
import {getPublicEventsById, getEventById} from "@/api/endpoints/events.ts";
import {packetEventsApi} from "@/api/endpoints/packet-events";
import {IEvent} from "@/types/events.ts";
import {usePaymentStore} from "@/store/usePaymentStore.ts";
import {orderHalyk, orderKaspi, orderSelfHalyk, orderSelfKaspi, orderKaspiCustomPrice, orderHalykCustomPrice} from "@/api/endpoints/order.ts";
import {PaymentHalyk} from "@/components/payment/PaymentHalyk.tsx";
import {toast} from "react-hot-toast";
import {useTranslation} from "react-i18next";
import {DepartmentType} from "@/types/payment.ts";
import {TengeIcon} from "@/assets/TengeIcon.tsx";

interface FormValues {
    fullname: string;
    email: string;
    cellphone: string;
    promo_code: string | null;
    department_id: string;
    event_id: string | null;
    payment_category_id: string | null;
    additional: string;
    paymentMethod: string;
    amount: number | null;
    showInUsd?: boolean;
}

export const usePaymentSchema = (departmentType: DepartmentType | null, eventPriced: boolean | null) => {
    const { t } = useTranslation();

    return yup.object().shape({
        fullname: yup.string().required(t("paymentPage.errors.fullname")),
        email: yup
            .string()
            .email(t("paymentPage.errors.email"))
            .required(t("paymentPage.errors.emailRequired")),
        cellphone: yup.string().required(t("paymentPage.errors.cellphone")),
        promo_code: yup.string().nullable(),
        department_id: yup.string().required(t("paymentPage.errors.department_id")),
        event_id: departmentType === "EVENT_BASED"
            ? yup.string().required(t("paymentPage.errors.event_id"))
            : yup.string().optional(),
        payment_category_id: yup.string().optional(),
        additional: yup.string().optional(),
        paymentMethod: yup.string().required(t("paymentPage.errors.paymentMethod")),
        amount: departmentType === "SELF_PAY" || (departmentType === "EVENT_BASED" && eventPriced === false)
            ? yup.number().typeError(t("paymentPage.errors.amount")).required(t("paymentPage.errors.amount"))
            : yup.number().nullable().optional(),
        showInUsd: yup.boolean().optional(),
    });
};

// ─── Reusable file upload button ────────────────────────────────────────────
interface FileUploadButtonProps {
    id: string;
    label: string;
    required?: boolean;
    fileName?: string;
    fileSize?: number;
    onChange: (file: { name: string; size: number; type: string; lastModified: number }) => void;
}

const FileUploadButton: FC<FileUploadButtonProps> = ({ id, label, required, fileName, fileSize, onChange }) => (
    <div className="ml-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
            <input
                type="file"
                id={id}
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        onChange({ name: file.name, size: file.size, type: file.type, lastModified: file.lastModified });
                    }
                }}
            />
            <button
                type="button"
                onClick={() => document.getElementById(id)?.click()}
                className="flex items-center justify-center gap-2 rounded-[5px] p-[13px] text-[16px] cursor-pointer select-none border transition-colors w-full text-white bg-[#006799] border-[#6B9AB0] hover:bg-[#004C71]"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-medium">{fileName || "Выберите файл"}</span>
            </button>
            {fileName && (
                <div className="mt-2 text-xs text-gray-600">
                    Файл: {fileName} ({((fileSize ?? 0) / 1024).toFixed(1)} KB)
                </div>
            )}
        </div>
    </div>
);

// ─── Types ───────────────────────────────────────────────────────────────────
type FileValue = { name: string; size: number; type: string; lastModified: number };
type FieldValue = string | boolean | FileValue;

export const PaymentForm: FC = () => {
    const {setPrice, setOrderField, setCurrency, discount, resetPromo} = usePaymentStore();
    const { t } = useTranslation();

    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [loading, setLoading] = useState(false);
    const [showWidget, setShowWidget] = useState(false);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [departmentOptions, setDepartmentOptions] = useState<Option[]>([]);
    const [eventOptions, setEventOptions] = useState<Option[]>([]);
    const [paymentCategoryOptions, setPaymentCategoryOptions] = useState<Option[]>([]);
    const [currentEventId, setCurrentEventId] = useState<string | null>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [additionalFields, setAdditionalFields] = useState<any[]>([]);
    const [additionalFieldValues, setAdditionalFieldValues] = useState<Record<string, FieldValue>>({});

    // Event additional fields — prefixed with "event_" in values map
    const [eventAdditionalFields, setEventAdditionalFields] = useState<any[]>([]);
    const [eventAdditionalFieldValues, setEventAdditionalFieldValues] = useState<Record<string, string | boolean>>({});

    // Payment category additional fields — prefixed with "payment_" in values map
    // Rendered ONLY inside the "Additional info" card — nowhere else.
    const [paymentCategoryAdditionalFields, setPaymentCategoryAdditionalFields] = useState<any[]>([]);
    const [paymentCategoryAdditionalFieldValues, setPaymentCategoryAdditionalFieldValues] = useState<Record<string, FieldValue>>({});

    const [selectedDepartmentType, setSelectedDepartmentType] = useState<DepartmentType | null>(null);
    const [selectedEventPriced, setSelectedEventPriced] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const data = await getPublicDepartments();
                setDepartments(data);
                const activeDepartments = data.filter((dept: any) => dept.active === true);
                const mapped = activeDepartments.map((dept: { name: string; id: string }) => ({
                    label: dept.name,
                    value: dept.id,
                }));
                setDepartmentOptions(mapped);
            } catch (error) {
                console.error("Failed to fetch departments:", error);
            }
        };
        fetchDepartments();
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!selectedDepartmentId) return;
            try {
                const data = await getPublicEventsById(selectedDepartmentId);
                const mapped = data.map((event: IEvent) => ({
                    label: event.title || '',
                    value: event.id || '',
                    price: Number(event.price || 0),
                    price_usd: event.price_usd ? Number(event.price_usd) : null,
                    priced: event.priced ?? true,
                })).filter((event: any) => event.label && event.value);
                setEventOptions(mapped);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
        };
        fetchEvents();
    }, [selectedDepartmentId]);

    const schema = usePaymentSchema(selectedDepartmentType, selectedEventPriced);
    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm<FormValues>({
        resolver: yupResolver(schema) as never,
        defaultValues: {
            fullname: '',
            email: '',
            cellphone: '',
            department_id: '',
            event_id: '',
            payment_category_id: '',
            additional: '',
            promo_code: null,
            paymentMethod: '',
            amount: null,
            showInUsd: false,
        }
    });

    useEffect(() => {
        const fetchPaymentCategories = async () => {
            if (!currentEventId) {
                setPaymentCategoryOptions([]);
                return;
            }
            try {
                const response = await packetEventsApi.getAll({ event_id: currentEventId });
                const paymentTypes = Array.isArray(response) ? response : (response as any).data || [];

                // Also fetch event-level additional fields
                try {
                    const eventData = await getEventById(currentEventId);
                    if (eventData.additional_fields) {
                        const eventFields = Object.entries(eventData.additional_fields).map(([name, config]: [string, any]) => ({
                            name,
                            type: config.type,
                            label: name,
                            required: config.required ?? false,
                        }));
                        setEventAdditionalFields(eventFields);
                    }
                } catch (error) {
                    console.error("Error fetching event additional fields:", error);
                }

                const paymentCategories = paymentTypes.map((pt: any) => ({
                    label: pt.category || `Тип платежа ${pt.id}`,
                    value: pt.id,
                    price: pt.price,
                    price_usd: pt.price_usd,
                    is_main: pt.is_main,
                    additional_fields: pt.additional_fields,
                }));
                setPaymentCategoryOptions(paymentCategories);
            } catch (error) {
                console.error("Error fetching payment categories:", error);
                setPaymentCategoryOptions([]);
            }
        };
        fetchPaymentCategories();
    }, [currentEventId]);

    const watchShowInUsd = watch("showInUsd");
    const watchPaymentMethod = watch("paymentMethod");
    const watchPaymentCategoryId = watch("payment_category_id");

    const [isKaspiDisabled, setIsKaspiDisabled] = useState(false);
    const [isUsdForced, setIsUsdForced] = useState(false);
    const [isKztForced, setIsKztForced] = useState(false);
    const [isCustomPrice, setIsCustomPrice] = useState(false);
    const [paymentMethodMessage, setPaymentMethodMessage] = useState("");

    // Auto-select main payment category
    useEffect(() => {
        if (paymentCategoryOptions.length > 0) {
            const mainCategory = paymentCategoryOptions.find(cat => (cat as any).is_main === true);
            if (mainCategory) {
                setValue("payment_category_id", mainCategory.value);
                const price = (mainCategory as any).price || 0;
                const priceUsd = (mainCategory as any).price_usd || 0;
                if (price > 0 && priceUsd === 0) {
                    setIsKztForced(true); setIsUsdForced(false);
                    setValue("showInUsd", false); setValue("amount", price); setPrice(price);
                } else if (price === 0 && priceUsd > 0) {
                    setIsUsdForced(true); setIsKztForced(false);
                    setValue("showInUsd", true); setValue("amount", priceUsd); setPrice(priceUsd);
                } else if (price > 0 && priceUsd > 0) {
                    setIsUsdForced(false); setIsKztForced(false);
                    setValue("showInUsd", false); setValue("amount", price); setPrice(price);
                } else {
                    setIsUsdForced(false); setIsKztForced(false);
                    setIsCustomPrice(true); setValue("amount", null); setPrice(0);
                }

                // Load additional fields for the auto-selected main category
                if ((mainCategory as any).additional_fields) {
                    const fields = Object.entries((mainCategory as any).additional_fields).map(([name, config]: [string, any]) => ({
                        name,
                        type: config.type,
                        label: name,
                        required: config.required ?? false,
                        options: config.options,
                    }));
                    setPaymentCategoryAdditionalFields(fields);
                } else {
                    setPaymentCategoryAdditionalFields([]);
                }
                setPaymentCategoryAdditionalFieldValues({});
            }
        }
    }, [paymentCategoryOptions, setValue, setPrice]);

    // React to payment category selection changes
    useEffect(() => {
        if (watchPaymentCategoryId) {
            const selectedCategory = paymentCategoryOptions.find(opt => opt.value === watchPaymentCategoryId);
            if (selectedCategory) {
                const categoryData = selectedCategory as any;
                const price = categoryData.price || 0;
                const priceUsd = categoryData.price_usd || 0;
                const hasOnlyKzt = price > 0 && priceUsd === 0;
                const hasOnlyUsd = price === 0 && priceUsd > 0;
                const hasBothPrices = price > 0 && priceUsd > 0;
                const hasCustomPrice = price === 0 && priceUsd === 0;

                setIsUsdForced(false); setIsKztForced(false);
                setIsKaspiDisabled(false); setPaymentMethodMessage("");

                if (hasOnlyUsd) {
                    setIsUsdForced(true); setIsKaspiDisabled(true);
                    setPaymentMethodMessage("Для данного события оплата через Kaspi недоступна");
                    setValue("showInUsd", true);
                    setValue("amount", priceUsd); setPrice(priceUsd);
                } else if (hasOnlyKzt) {
                    setIsKztForced(true); setValue("showInUsd", false);
                    setValue("amount", price); setPrice(price);
                } else if (hasBothPrices) {
                    if (watchShowInUsd) { setValue("amount", priceUsd); setPrice(priceUsd); }
                    else { setValue("amount", price); setPrice(price); }
                } else if (hasCustomPrice) {
                    setIsCustomPrice(true); setValue("amount", null); setPrice(0);
                }

                // ── Load payment category additional fields (single source of truth) ──
                if (categoryData.additional_fields) {
                    const fields = Object.entries(categoryData.additional_fields).map(([name, config]: [string, any]) => ({
                        name,
                        type: config.type,
                        label: name,
                        required: config.required ?? false,
                        options: config.options,
                    }));
                    setPaymentCategoryAdditionalFields(fields);
                } else {
                    setPaymentCategoryAdditionalFields([]);
                }
                // Clear previous values when category changes
                setPaymentCategoryAdditionalFieldValues({});
            }
        } else {
            setIsUsdForced(false); setIsKztForced(false);
            setIsKaspiDisabled(false); setPaymentMethodMessage("");
            setIsCustomPrice(false); setValue("amount", null); setPrice(0);
            setPaymentCategoryAdditionalFields([]);
            setPaymentCategoryAdditionalFieldValues({});
        }
    }, [watchPaymentCategoryId, watchShowInUsd, paymentCategoryOptions, setValue, setPrice]);

    useEffect(() => {
        if (!watchPaymentCategoryId) { setValue("amount", null); setPrice(0); }
    }, [watchPaymentCategoryId, setValue, setPrice]);

    const handleAdditionalChange = (key: string, value: any) => {
        const formattedValue = value instanceof Date ? formatDate(value) : value;
        setAdditionalFieldValues((prev) => ({ ...prev, [key]: formattedValue }));
    };

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (data.paymentMethod === "KaspiBank" && data.showInUsd === true) {
            toast.error("Kaspi Bank does not support USD payments. Please select HalykBank for non-resident payments or change to Resident.");
            return;
        }

        setLoading(true);
        try {
            let currency: "KZT" | "USD" = "KZT";
            if (data.paymentMethod === "HalykBank" && data.showInUsd === true) currency = "USD";

            const convertAdditionalFields = (
                fields: Record<string, FieldValue>
            ): Record<string, string | boolean> => {
                const converted: Record<string, string | boolean> = {};
                Object.entries(fields).forEach(([key, value]) => {
                    if (typeof value === 'object' && value !== null && 'name' in value) {
                        const fileName = (value as FileValue).name || 'file';
                        converted[key] = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_').substring(0, 100);
                    } else {
                        converted[key] = value as string | boolean;
                    }
                });
                return converted;
            };

            if (data.amount && typeof data.amount !== 'number') {
                toast.error("Ошибка в сумме платежа. Пожалуйста, выберите категорию заново.");
                return;
            }
            if (data.amount && (data.amount <= 0 || data.amount > 999999)) {
                toast.error("Сумма платежа должна быть положительным числом.");
                return;
            }

            // Validate required event fields
            const hasMissingEventFields = eventAdditionalFields.some(field => {
                if (field.required && !eventAdditionalFieldValues[field.name]) {
                    toast.error(`Поле "${field.label}" обязательно для заполнения`);
                    return true;
                }
                return false;
            });
            if (hasMissingEventFields) return;

            // Validate required payment category fields
            const hasMissingPaymentFields = paymentCategoryAdditionalFields.some(field => {
                const value = paymentCategoryAdditionalFieldValues[field.name];
                if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
                    toast.error(`Поле "${field.label}" обязательно для заполнения`);
                    return true;
                }
                return false;
            });
            if (hasMissingPaymentFields) return;

            if (isCustomPrice && (!data.amount || data.amount <= 0)) {
                toast.error("При произвольной цене введите сумму больше 0.");
                return;
            }

            // Merge additional fields with namespaced keys to avoid collisions
            const mergedAdditional = convertAdditionalFields({
                ...additionalFieldValues,
                ...Object.fromEntries(
                    Object.entries(eventAdditionalFieldValues).map(([k, v]) => [`event_${k}`, v])
                ),
                ...Object.fromEntries(
                    Object.entries(paymentCategoryAdditionalFieldValues).map(([k, v]) => [`payment_${k}`, v])
                ),
            });

            const payload = { ...data, additional_fields: mergedAdditional, currency };

            if (selectedDepartmentType === "EVENT_BASED") {
                if (data.paymentMethod === "KaspiBank") {
                    if (selectedEventPriced === false) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { paymentMethod, department_id, promo_code, showInUsd, ...customPriceData } = payload;
                        const kaspiData = await orderKaspiCustomPrice({ ...customPriceData, event_id: customPriceData.event_id!, amount: customPriceData.amount!, currency: "KZT" });
                        setPaymentData(kaspiData);
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { paymentMethod, department_id, amount, showInUsd, ...rest } = payload;
                        setPaymentData(await orderKaspi({ ...rest, currency: "KZT" }));
                    }
                } else if (data.paymentMethod === "HalykBank") {
                    if (selectedEventPriced === false) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { paymentMethod, department_id, promo_code, showInUsd, ...customPriceData } = payload;
                        try {
                            setPaymentData(await orderHalykCustomPrice({ ...customPriceData, event_id: customPriceData.event_id!, amount: customPriceData.amount!, currency }));
                            setShowWidget(true);
                        } catch { toast.error("Ошибка при создании платежа. Пожалуйста, попробуйте еще раз."); }
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { paymentMethod, department_id, amount, showInUsd, ...rest } = payload;
                        try {
                            setPaymentData(await orderHalyk({ ...rest, currency }));
                            setShowWidget(true);
                        } catch { toast.error("Ошибка при создании платежа. Пожалуйста, попробуйте еще раз."); }
                    }
                }
            } else if (selectedDepartmentType === "SELF_PAY") {
                if (data.paymentMethod === "KaspiBank") {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { paymentMethod, event_id, promo_code, showInUsd, ...rest } = payload;
                    setPaymentData(await orderSelfKaspi({ ...rest, currency: "KZT" }));
                } else if (data.paymentMethod === "HalykBank") {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { paymentMethod, event_id, promo_code, showInUsd, ...rest } = payload;
                    setPaymentData(await orderSelfHalyk({ ...rest, currency: "KZT" }));
                    setShowWidget(true);
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.detail?.[0]?.msg || t('paymentPage.toasts.error'));
            console.error("Payment API error:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    useEffect(() => {
        const url = paymentData?.redirect_url;
        if (url && typeof url === "string" && url.length > 0) {
            setTimeout(() => { window.location.href = url; }, 300);
        }
    }, [paymentData]);

    // ── Helper: render a single additional field ────────────────────────────
    const renderAdditionalField = (
        field: { name: string; type: string; label: string; required?: boolean; options?: string[] },
        prefix: "event" | "payment",
        values: Record<string, FieldValue>,
        setValues: React.Dispatch<React.SetStateAction<Record<string, FieldValue>>>
    ) => {
        const key = field.name;
        const uniqueId = `${prefix}_${key}`;

        if (field.type === "checkbox") {
            return (
                <label key={uniqueId} className="flex items-center gap-2 ml-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={Boolean(values[key])}
                        onChange={(e) => setValues(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-4 h-4 rounded accent-[#6B9AB0]"
                    />
                    <span className="text-black">{field.label}</span>
                    {field.required && <span className="text-red-500">*</span>}
                </label>
            );
        }

        if (field.type === "file") {
            const fileVal = values[key] as FileValue | undefined;
            return (
                <FileUploadButton
                    key={uniqueId}
                    id={`file-${uniqueId}`}
                    label={field.label}
                    required={field.required}
                    fileName={fileVal?.name}
                    fileSize={fileVal?.size}
                    onChange={(file) => setValues(prev => ({ ...prev, [key]: file }))}
                />
            );
        }

        if (field.type === "select") {
            return (
                <div key={uniqueId} className="ml-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                        value={(values[key] as string) || ""}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setValues(prev => ({ ...prev, [key]: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B9AB0] focus:border-transparent"
                        required={field.required}
                    >
                        <option value="">Выберите опцию</option>
                        {field.options?.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            );
        }

        if (field.type === "date") {
            return (
                <div key={uniqueId} className="ml-2">
                    <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                        type="date"
                        value={typeof values[key] === "string" ? (values[key] as string) : ""}
                        onChange={(e) => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                        required={field.required}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B9AB0]"
                    />
                </div>
            );
        }

        // Default: text / number / email etc.
        return (
            <CustomInput
                key={uniqueId}
                icon={<UserIcon className="text-[#6B9AB0]" />}
                type={field.type}
                value={(values[key] as string) || ""}
                onChange={(e) => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={field.label}
                required={field.required}
            />
        );
    };

    const hasAdditionalInfo = eventAdditionalFields.length > 0 || paymentCategoryAdditionalFields.length > 0;

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-[#FFFFFF] font-medium text-[20px] md:w-[610px] md:px-[94px] px-5 py-[32px] rounded-[6px] border-2 border-[#006799]"
        >
            <p className="mb-[31px] text-[24px]">{t('paymentPage.personalInfo')}</p>
            <div className="flex flex-col md:w-full w-[340px] gap-[20px]">
                {/* ── Full name ── */}
                <Controller
                    name="fullname"
                    control={control}
                    render={({ field }) => (
                        <>
                            <CustomInput
                                {...field}
                                icon={<UserIcon className={`text-[#6B9AB0] ${errors.fullname ? "text-red-500" : ""}`} />}
                                type="text"
                                onChange={(e) => { field.onChange(e); setOrderField("fullname", e.target.value); }}
                                placeholder={t('paymentPage.inputs.namePH')}
                                error={errors.fullname?.message}
                            />
                            {errors.fullname && <p className="text-red-500 text-sm -mt-4 ml-2">{errors.fullname.message}</p>}
                        </>
                    )}
                />

                {/* ── Email ── */}
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                        <>
                            <CustomInput
                                {...field}
                                icon={<EnvelopeIcon className={`text-[#6B9AB0] ${errors.email ? "text-red-500" : ""}`} />}
                                type="email"
                                onChange={(e) => { field.onChange(e); setOrderField("email", e.target.value); }}
                                placeholder={t('paymentPage.inputs.emailPH')}
                                error={errors.email?.message}
                            />
                            {errors.email && <p className="text-red-500 text-sm -mt-4 ml-2">{errors.email.message}</p>}
                        </>
                    )}
                />

                {/* ── Phone ── */}
                <Controller
                    name="cellphone"
                    control={control}
                    render={({ field }) => (
                        <>
                            <CustomInput
                                {...field}
                                icon={<PhoneIcon className={`text-[#6B9AB0] ${errors.cellphone ? "text-red-500" : ""}`} />}
                                type="text"
                                onChange={(e) => { field.onChange(e); setOrderField("cellphone", e.target.value); }}
                                placeholder={t('paymentPage.inputs.phonePH')}
                                error={errors.cellphone?.message}
                            />
                            {errors.cellphone && <p className="text-red-500 text-sm -mt-4 ml-2">{errors.cellphone.message}</p>}
                        </>
                    )}
                />

                {/* ── Department ── */}
                <Controller
                    name="department_id"
                    control={control}
                    render={({ field }) => (
                        <>
                            <CustomSelect
                                {...field}
                                options={departmentOptions}
                                value={field.value}
                                onChange={(val) => {
                                    field.onChange(val);
                                    setSelectedDepartmentId(val);

                                    if (discount > 0) {
                                        setValue("promo_code", null);
                                        resetPromo();
                                        toast("Промокод сброшен. Департамент изменен.", { icon: "ℹ️" });
                                    }

                                    setValue("event_id", null);
                                    setOrderField("event_id", "");
                                    setEventOptions([]);
                                    setSelectedEventPriced(null);
                                    setPrice(0);

                                    setValue("payment_category_id", null);
                                    setOrderField("payment_category_id", "");
                                    setPaymentCategoryOptions([]);
                                    setPaymentCategoryAdditionalFields([]);
                                    setPaymentCategoryAdditionalFieldValues({});

                                    setValue("showInUsd", false);
                                    setCurrency("KZT");
                                    setAdditionalFieldValues({});

                                    type AdditionalFieldsMap = Record<string, { type: string }>;
                                    const selected = departments.find((d) => d.id === val);
                                    setSelectedDepartmentType(selected?.type as DepartmentType || null);

                                    const additional = (selected?.additional_fields || {}) as AdditionalFieldsMap;
                                    const parsed = Object.entries(additional).map(([label, config]) => ({
                                        label,
                                        type: config.type,
                                        name: label.replace(/\s+/g, "_").toLowerCase(),
                                    }));
                                    setAdditionalFields(parsed);
                                }}
                                triggerClassName={"text-white"}
                                placeholder={t('paymentPage.inputs.selectDepPH')}
                                error={errors.department_id?.message}
                            />
                            {errors.department_id && <p className="text-red-500 text-sm -mt-2 ml-2">{errors.department_id.message}</p>}
                        </>
                    )}
                />

                {selectedDepartmentId && (
                    <>
                        {/* ── Department additional fields ── */}
                        {additionalFields.map((field) => {
                            const key = field.name;
                            if (field.type === "checkbox") {
                                return (
                                    <label key={key} className="flex items-center gap-2 ml-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(additionalFieldValues[key])}
                                            onChange={(e) => handleAdditionalChange(key, e.target.checked)}
                                            className="w-4 h-4 rounded accent-[#6B9AB0]"
                                        />
                                        <span className="text-black">{field.label}</span>
                                    </label>
                                );
                            }
                            if (field.type === "date") {
                                return (
                                    <div key={key} className="ml-2">
                                        <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                                        <input
                                            type="date"
                                            value={typeof additionalFieldValues[key] === "string" ? new Date(additionalFieldValues[key] as string).toISOString().split('T')[0] : ''}
                                            onChange={(e) => handleAdditionalChange(key, e.target.value)}
                                        />
                                    </div>
                                );
                            }
                            if (field.type === "file") {
                                const fileVal = additionalFieldValues[key] as FileValue | undefined;
                                return (
                                    <FileUploadButton
                                        key={key}
                                        id={`file-dept-${key}`}
                                        label={field.label}
                                        fileName={fileVal?.name}
                                        fileSize={fileVal?.size}
                                        onChange={(file) => handleAdditionalChange(key, file)}
                                    />
                                );
                            }
                            return (
                                <CustomInput
                                    key={key}
                                    icon={<UserIcon className="text-[#6B9AB0]" />}
                                    type={field.type}
                                    value={(additionalFieldValues[key] as string) || ""}
                                    onChange={(e) => handleAdditionalChange(key, e.target.value)}
                                    placeholder={field.label}
                                />
                            );
                        })}

                        {/* ── Event select ── */}
                        <Controller
                            name="event_id"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <CustomSelect
                                        {...field}
                                        options={eventOptions}
                                        value={field.value || ''}
                                        onChange={(val) => {
                                            field.onChange(val);
                                            setOrderField("event_id", val);
                                            setCurrentEventId(val);

                                            if (discount > 0) {
                                                setValue("promo_code", null);
                                                resetPromo();
                                                toast("Промокод сброшен. Событие изменено.", { icon: "ℹ️" });
                                            }

                                            setValue("showInUsd", false);
                                            setCurrency("KZT");

                                            // Reset payment category when event changes
                                            setValue("payment_category_id", null);
                                            setPaymentCategoryOptions([]);
                                            setPaymentCategoryAdditionalFields([]);
                                            setPaymentCategoryAdditionalFieldValues({});
                                            setEventAdditionalFields([]);
                                            setEventAdditionalFieldValues({});

                                            const selectedEvent = eventOptions.find(e => e.value === val);
                                            if (selectedEvent && "price" in selectedEvent) {
                                                setPrice(Number((selectedEvent as IEvent).price));
                                                setSelectedEventPriced((selectedEvent as any).priced ?? true);
                                            }
                                        }}
                                        triggerClassName={"text-white"}
                                        placeholder={t('paymentPage.inputs.selectEvPH')}
                                        error={errors.event_id?.message}
                                    />
                                    {errors.event_id && <p className="text-red-500 text-sm -mt-2 ml-2">{errors.event_id.message}</p>}
                                </>
                            )}
                        />

                        {/* ── Payment category select ── */}
                        {currentEventId && paymentCategoryOptions.length > 0 && (
                            <Controller
                                name="payment_category_id"
                                control={control}
                                render={({ field }) => (
                                    <>
                                        <CustomSelect
                                            {...field}
                                            options={paymentCategoryOptions}
                                            value={field.value || ''}
                                            onChange={(val) => {
                                                field.onChange(val);
                                                setOrderField("payment_category_id", val);
                                                // NOTE: additional fields are loaded in the useEffect above —
                                                // no inline field extraction here to avoid duplication.
                                            }}
                                            triggerClassName={"text-white"}
                                            placeholder={t('paymentPage.inputs.selectPaymentTypePH')}
                                            error={errors.payment_category_id?.message}
                                        />
                                        {errors.payment_category_id && (
                                            <p className="text-red-500 text-sm -mt-2 ml-2">{errors.payment_category_id.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        )}

                        {/* ══════════════════════════════════════════════════════════════════
                            "Additional info" card — SINGLE render point for:
                              • Event additional fields     (prefix: "event")
                              • Payment category fields     (prefix: "payment")
                            Payment category fields are rendered ONLY here.
                        ══════════════════════════════════════════════════════════════════ */}
                        {hasAdditionalInfo && (
                            <div className="flex flex-col gap-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Additional info</h3>

                                {eventAdditionalFields.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Event fields</h4>
                                        {eventAdditionalFields.map((field) =>
                                            renderAdditionalField(
                                                field,
                                                "event",
                                                eventAdditionalFieldValues,
                                                setEventAdditionalFieldValues as React.Dispatch<React.SetStateAction<Record<string, FieldValue>>>
                                            )
                                        )}
                                    </div>
                                )}

                                {paymentCategoryAdditionalFields.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Payment type fields</h4>
                                        {paymentCategoryAdditionalFields.map((field) =>
                                            renderAdditionalField(
                                                field,
                                                "payment",
                                                paymentCategoryAdditionalFieldValues,
                                                setPaymentCategoryAdditionalFieldValues
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── showInUsd checkbox — only when both prices or custom price ── */}
                        {watchPaymentCategoryId && (() => {
                            const selectedCategory = paymentCategoryOptions.find(opt => opt.value === watchPaymentCategoryId);
                            if (!selectedCategory) return false;
                            const d = selectedCategory as any;
                            return (d.price > 0 && d.price_usd > 0) || (d.price === 0 && d.price_usd === 0);
                        })() && (
                            <Controller
                                name="showInUsd"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex flex-col gap-2">
                                        <label className={`flex items-center gap-3 ml-2 cursor-pointer group ${isUsdForced || isKztForced ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={field.value || false}
                                                onChange={(e) => {
                                                    if (isUsdForced || isKztForced) return;
                                                    const isChecked = e.target.checked;
                                                    field.onChange(isChecked);
                                                    const cat = paymentCategoryOptions.find(opt => opt.value === watchPaymentCategoryId) as any;
                                                    if (cat) {
                                                        if (isChecked) { setValue("amount", cat.price_usd || null); setPrice(cat.price_usd || 0); setCurrency("USD"); }
                                                        else { setValue("amount", cat.price || null); setPrice(cat.price || 0); setCurrency("KZT"); }
                                                    }
                                                }}
                                                disabled={isUsdForced || isKztForced}
                                                className="w-4 h-4 rounded accent-[#6B9AB0]"
                                            />
                                            <span className="text-black group-hover:text-[#6B9AB0] transition-colors">
                                                {t('paymentPage.inputs.showInUsd')}
                                                {isUsdForced && " (только USD)"}
                                                {isKztForced && " (только KZT)"}
                                            </span>
                                        </label>
                                    </div>
                                )}
                            />
                        )}

                        {/* ── Payment method ── */}
                        <Controller
                            name="paymentMethod"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <PaymentMethod
                                        {...field}
                                        error={errors.paymentMethod?.message}
                                        onChange={(value) => {
                                            if (watchShowInUsd && value === "KaspiBank") return;
                                            setValue("paymentMethod", value);
                                        }}
                                        disableKaspi={watchShowInUsd || isKaspiDisabled}
                                    />
                                    {paymentMethodMessage && (
                                        <p className="text-yellow-600 text-sm -mt-2 ml-2">⚠️ {paymentMethodMessage}</p>
                                    )}
                                    {errors.paymentMethod && (
                                        <p className="text-red-500 text-sm -mt-2 ml-2">{errors.paymentMethod.message}</p>
                                    )}
                                    {watchShowInUsd && watchPaymentMethod === "KaspiBank" && (
                                        <p className="text-red-500 text-sm -mt-2 ml-2">
                                            ⚠️ Kaspi Bank does not support USD payments for non-residents. Please select HalykBank.
                                        </p>
                                    )}
                                </>
                            )}
                        />

                        {/* ── Amount / promo / checkout ── */}
                        {selectedDepartmentType === "EVENT_BASED" ? (
                            <>
                                {selectedEventPriced !== false && (
                                    <Controller
                                        name="promo_code"
                                        control={control}
                                        render={({ field }) => (
                                            <PromocodeInput promoCodeField={{ ...field, value: field.value ?? undefined }} />
                                        )}
                                    />
                                )}

                                {selectedEventPriced === false && (
                                    <Controller
                                        name="amount"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                <CustomInput
                                                    {...field}
                                                    disabled={false}
                                                    icon={watchShowInUsd
                                                        ? <CurrencyDollarIcon className={errors.amount ? "text-red-500" : "text-[#6B9AB0]"} />
                                                        : <TengeIcon color={errors.amount ? "#fb2c36" : "#6B9AB0"} />
                                                    }
                                                    type="number"
                                                    onChange={(e) => { field.onChange(e); setOrderField("amount", Number(e.target.value)); }}
                                                    placeholder={isCustomPrice ? "Введите сумму" : t('paymentPage.inputs.amountPH')}
                                                    error={errors.amount?.message}
                                                />
                                                {errors.amount && <p className="text-red-500 text-sm -mt-4 ml-2">{errors.amount.message}</p>}
                                            </>
                                        )}
                                    />
                                )}

                                {(selectedEventPriced !== false || isCustomPrice) && (
                                    <Controller
                                        name="amount"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                <CustomInput
                                                    {...field}
                                                    disabled={!isCustomPrice}
                                                    icon={watchShowInUsd
                                                        ? <CurrencyDollarIcon className={errors.amount ? "text-red-500" : "text-[#6B9AB0]"} />
                                                        : <TengeIcon color={errors.amount ? "#fb2c36" : "#6B9AB0"} />
                                                    }
                                                    type="number"
                                                    onChange={(e) => { field.onChange(e); setOrderField("amount", Number(e.target.value)); }}
                                                    placeholder={isCustomPrice ? "Введите сумму" : t('paymentPage.inputs.amountPH')}
                                                    error={errors.amount?.message}
                                                />
                                                {errors.amount && <p className="text-red-500 text-sm -mt-4 ml-2">{errors.amount.message}</p>}
                                            </>
                                        )}
                                    />
                                )}

                                {selectedEventPriced !== false && !isCustomPrice && <CheckOut />}
                            </>
                        ) : (
                            <Controller
                                name="amount"
                                control={control}
                                render={({ field }) => (
                                    <>
                                        <CustomInput
                                            {...field}
                                            disabled={!isCustomPrice}
                                            icon={<TengeIcon color={errors.amount ? "#fb2c36" : "#6B9AB0"} />}
                                            type="number"
                                            onChange={(e) => { field.onChange(e); setOrderField("amount", Number(e.target.value)); }}
                                            placeholder={isCustomPrice ? "Введите сумму" : t('paymentPage.inputs.amountPH')}
                                            error={errors.amount?.message}
                                        />
                                        {errors.amount && <p className="text-red-500 text-sm -mt-4 ml-2">{errors.amount.message}</p>}
                                    </>
                                )}
                            />
                        )}

                        {/* ── Submit ── */}
                        {!loading ? (
                            <CustomButton
                                type="submit"
                                variant="submit"
                                disabled={isCustomPrice && (!watch("amount") || Number(watch("amount")) <= 0)}
                                className="bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] px-4 py-2 text-white font-medium rounded-md transition duration-200 ease-in-out shadow-md hover:shadow-lg"
                            >
                                {t('paymentPage.payBtn')}
                            </CustomButton>
                        ) : (
                            <CustomButton type="submit" disabled variant="disabled" className="bg-[#2563EB] px-4 py-2 text-white font-medium rounded-md opacity-75 shadow-md">
                                <PulseLoader size={6} color={"#ffff"} />
                            </CustomButton>
                        )}
                    </>
                )}
            </div>

            {paymentData && (
                <PaymentHalyk
                    currency={paymentData.order.currency}
                    showWidget={showWidget}
                    amount={paymentData.order.final_amount}
                    terminalId={paymentData.terminal_id}
                    orderId={paymentData.order.id.toString()}
                    email={paymentData.order.email}
                    oauthData={paymentData.auth}
                    successUrl="https://ems.sdu.edu.kz/success"
                    failUrl="https://ems.sdu.edu.kz/fail"
                    description={`Оплата за ${paymentData.order.event?.title || ''}`}
                    onClose={() => setShowWidget(false)}
                />
            )}
        </form>
    );
};