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
    const [departments, setDepartments] = useState<any[]>([]); // store all data
    const [additionalFields, setAdditionalFields] = useState<any[]>([]);
    const [additionalFieldValues, setAdditionalFieldValues] = useState<Record<string, string | boolean | { name: string; size: number; type: string; lastModified: number }>>({});
    const [eventAdditionalFields, setEventAdditionalFields] = useState<any[]>([]);
    const [eventAdditionalFieldValues, setEventAdditionalFieldValues] = useState<Record<string, string | boolean>>({});
    const [paymentCategoryAdditionalFields, setPaymentCategoryAdditionalFields] = useState<any[]>([]);
    const [paymentCategoryAdditionalFieldValues, setPaymentCategoryAdditionalFieldValues] = useState<Record<string, string | boolean | { name: string; size: number; type: string; lastModified: number }>>({});
    const [selectedDepartmentType, setSelectedDepartmentType] = useState<DepartmentType | null>(null);
    const [selectedEventPriced, setSelectedEventPriced] = useState<boolean | null>(null);
    //const [showInUsd, setShowInUsd] = useState(false);




    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const data = await getPublicDepartments();
                setDepartments(data);

                // Фильтруем только активные департаменты
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
                console.log("Fetching events for department:", selectedDepartmentId);
                const data = await getPublicEventsById(selectedDepartmentId);
                console.log("Raw events data from API:", data);
                
                const mapped = data.map((event: IEvent) => ({
                    label: event.title || '',
                    value: event.id || '',
                    price: Number(event.price || 0),
                    price_usd: event.price_usd ? Number(event.price_usd) : null,
                    priced: event.priced ?? true,
                })).filter(event => event.label && event.value);
                
                console.log("Mapped events for select:", mapped);
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
                console.log("Fetching payment categories for event:", currentEventId);
                const response = await packetEventsApi.getAll({ event_id: currentEventId });
                console.log("Payment types response:", response);
                
                // Обрабатываем ответ API - может быть массив или объект с data
                const paymentTypes = Array.isArray(response) ? response : (response as any).data || [];
                
                // Загружаем дополнительные поля события
                const selectedEvent = eventOptions.find(opt => opt.value === currentEventId);
                if (selectedEvent) {
                    // Получаем данные о событии из API
                    try {
                        const eventData = await getEventById(currentEventId);
                        if (eventData.additional_fields) {
                            const eventFields = Object.entries(eventData.additional_fields).map(([name, config]: [string, any]) => ({
                                name,
                                type: config.type,
                                label: name
                            }));
                            setEventAdditionalFields(eventFields);
                        }
                    } catch (error) {
                        console.error("Error fetching event additional fields:", error);
                    }
                }
                
                // Загружаем дополнительные полей для каждой категории платежа
                const paymentCategories = paymentTypes.map((pt: any) => ({
                    label: pt.category || `Тип платежа ${pt.id}`,
                    value: pt.id,
                    price: pt.price,
                    price_usd: pt.price_usd,
                    additional_fields: pt.additional_fields
                }));
                
                setPaymentCategoryOptions(paymentCategories);
                console.log("Payment categories with additional fields:", paymentCategories);
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

    // Состояния для управления доступностью методов оплаты
    const [isKaspiDisabled, setIsKaspiDisabled] = useState(false);
    const [isUsdForced, setIsUsdForced] = useState(false);
    const [isKztForced, setIsKztForced] = useState(false);
    const [isCustomPrice, setIsCustomPrice] = useState(false); // Добавляем состояние для произвольной цены
    const [paymentMethodMessage, setPaymentMethodMessage] = useState("");

    // Автозаполнение главного типа оплаты
    useEffect(() => {
        if (paymentCategoryOptions.length > 0) {
            const mainCategory = paymentCategoryOptions.find(cat => {
                const categoryData = cat as any;
                return categoryData.main === true;
            });
            
            if (mainCategory) {
                console.log("🔍 Found main payment category:", mainCategory);
                setValue("payment_category_id", mainCategory.value);
                
                // Устанавливаем цену и валюту на основе главного типа
                const price = (mainCategory as any).price || 0;
                const priceUsd = (mainCategory as any).price_usd || 0;
                
                if (price > 0 && priceUsd === 0) {
                    // Только KZT
                    setIsKztForced(true);
                    setIsUsdForced(false);
                    setValue("showInUsd", false);
                    setValue("amount", price);
                    setPrice(price);
                } else if (price === 0 && priceUsd > 0) {
                    // Только USD
                    setIsUsdForced(true);
                    setIsKztForced(false);
                    setValue("showInUsd", true);
                    setValue("amount", priceUsd);
                    setPrice(priceUsd);
                } else if (price > 0 && priceUsd > 0) {
                    // Обе цены
                    setIsUsdForced(false);
                    setIsKztForced(false);
                    setValue("showInUsd", false); // По умолчанию KZT
                    setValue("amount", price);
                    setPrice(price);
                } else {
                    // Произвольная цена
                    setIsUsdForced(false);
                    setIsKztForced(false);
                    setIsCustomPrice(true);
                    setValue("amount", null);
                    setPrice(0);
                }
            }
        }
    }, [paymentCategoryOptions, setValue, setPrice, setIsKztForced, setIsUsdForced, setIsCustomPrice]);

    // Умная логика валют и цен
    useEffect(() => {
        if (watchPaymentCategoryId) {
            const selectedCategory = paymentCategoryOptions.find(opt => opt.value === watchPaymentCategoryId);
            if (selectedCategory) {
                const categoryData = selectedCategory as any;
                console.log("Selected payment category:", categoryData);
                
                const price = categoryData.price || 0;
                const priceUsd = categoryData.price_usd || 0;
                
                // Определяем логику валют
                const hasOnlyKzt = price > 0 && priceUsd === 0;
                const hasOnlyUsd = price === 0 && priceUsd > 0;
                const hasBothPrices = price > 0 && priceUsd > 0;
                const hasCustomPrice = price === 0 && priceUsd === 0;
                
                // Сбрасываем состояния
                setIsUsdForced(false);
                setIsKztForced(false);
                setIsKaspiDisabled(false);
                setPaymentMethodMessage("");
                
                if (hasOnlyUsd) {
                    // Только USD - принудительно включаем USD и блокируем Kaspi
                    setIsUsdForced(true);
                    setIsKaspiDisabled(true);
                    setPaymentMethodMessage("Для данного события оплата через Kaspi недоступна");
                    setValue("showInUsd", true);
                    
                    // Устанавливаем цену USD
                    const usdAmount = priceUsd || 0;
                    setValue("amount", usdAmount);
                    setPrice(usdAmount);
                    console.log("🔍 Set USD amount:", usdAmount, "from priceUsd:", priceUsd);
                } else if (hasOnlyKzt) {
                    // Только KZT - принудительно выключаем USD
                    setIsKztForced(true);
                    setValue("showInUsd", false);
                    
                    // Устанавливаем цену KZT
                    const kztAmount = price || 0;
                    setValue("amount", kztAmount);
                    setPrice(kztAmount);
                    console.log("🔍 Set KZT amount:", kztAmount, "from price:", price);
                } else if (hasBothPrices) {
                    // Обе цены - позволяем выбор валюты
                    // Устанавливаем цену в зависимости от текущего выбора
                    if (watchShowInUsd) {
                        const usdAmount = priceUsd || 0;
                        setValue("amount", usdAmount);
                        setPrice(usdAmount);
                        console.log("🔍 Set USD amount (both prices):", usdAmount, "from priceUsd:", priceUsd);
                    } else {
                        const kztAmount = price || 0;
                        setValue("amount", kztAmount);
                        setPrice(kztAmount);
                        console.log("🔍 Set KZT amount (both prices):", kztAmount, "from price:", price);
                    }
                } else if (hasCustomPrice) {
                    // Произвольная цена - позволяем выбор валюты и ввод суммы
                    setIsUsdForced(false);
                    setIsKztForced(false);
                    setIsKaspiDisabled(false);
                    setPaymentMethodMessage("");
                    setIsCustomPrice(true); // Устанавливаем состояние произвольной цены
                    setValue("amount", null);
                    setPrice(0);
                    console.log("🔍 Set custom price: null");
                }
            }
        } else {
            // Сброс при отсутствии категории
            setIsUsdForced(false);
            setIsKztForced(false);
            setIsKaspiDisabled(false);
            setPaymentMethodMessage("");
            setIsCustomPrice(false); // Сбрасываем состояние произвольной цены
            setValue("amount", null);
            setPrice(0);
        }
    }, [watchPaymentCategoryId, watchShowInUsd, paymentCategoryOptions, setValue, setPrice]);

    // Очистка цены при сбросе категории
    useEffect(() => {
        if (!watchPaymentCategoryId) {
            setValue("amount", null);
            setPrice(0);
        }
    }, [watchPaymentCategoryId, setValue, setPrice]);

    const handleAdditionalChange = (key: string, value: any) => {
        const formattedValue =
            value instanceof Date ? formatDate(value) : value;

        setAdditionalFieldValues((prev) => ({
            ...prev,
            [key]: formattedValue,
        }));
    };


    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        console.log("data", data);

        // Validate Kaspi doesn't support non-resident (USD)
        if (data.paymentMethod === "KaspiBank" && data.showInUsd === true) {
            toast.error("Kaspi Bank does not support USD payments. Please select HalykBank for non-resident payments or change to Resident.");
            return;
        }

        setLoading(true);
        try {
            // Determine currency based on payment method and residency status
            let currency: "KZT" | "USD" = "KZT";
            if (data.paymentMethod === "HalykBank" && data.showInUsd === true) {
                currency = "USD";
            }

            // Функция для преобразования файловых данных в правильный формат
            const convertAdditionalFields = (fields: Record<string, string | boolean | { name: string; size: number; type: string; lastModified: number }>): Record<string, string | boolean> => {
                const converted: Record<string, string | boolean> = {};
                Object.entries(fields).forEach(([key, value]) => {
                    if (typeof value === 'object' && value !== null && 'name' in value) {
                        // Для файлов извлекаем только имя файла и очищаем его от спецсимволов
                        const fileName = (value as any).name || 'file';
                        // Очищаем имя файла от пробелов и спецсимволов
                        const cleanFileName = fileName
                            .replace(/[^a-zA-Z0-9._-]/g, '_') // Заменяем недопустимые символы на _
                            .replace(/\s+/g, '_') // Заменяем пробелы на _
                            .substring(0, 100); // Ограничиваем длину
                        
                        converted[key] = cleanFileName;
                        console.log(`🔍 Converting file field ${key}:`, {
                            original: value,
                            fileName: fileName,
                            cleanFileName: cleanFileName
                        });
                    } else {
                        converted[key] = value;
                    }
                });
                return converted;
            };

            console.log("🔍 Payment payload:", {
                amount: data.amount,
                amountType: typeof data.amount,
                currency: currency,
                showInUsd: data.showInUsd,
                paymentMethod: data.paymentMethod,
                paymentCategoryId: data.payment_category_id,
                eventId: data.event_id,
                additionalFieldsRaw: additionalFieldValues,
                additionalFieldsConverted: convertAdditionalFields(additionalFieldValues)
            });

            // Валидация amount
            if (data.amount && typeof data.amount !== 'number') {
                console.error("❌ Invalid amount type:", typeof data.amount, data.amount);
                toast.error("Ошибка в сумме платежа. Пожалуйста, выберите категорию заново.");
                return;
            }

            if (data.amount && (data.amount <= 0 || data.amount > 999999)) {
                console.error("❌ Invalid amount value:", data.amount);
                toast.error("Сумма платежа должна быть положительным числом.");
                return;
            }

            // Дополнительная валидация для произвольной цены
            if (isCustomPrice && (!data.amount || data.amount <= 0)) {
                console.error("❌ Custom price requires amount:", data.amount);
                toast.error("При произвольной цене введите сумму больше 0.");
                return;
            }

            const payload = {
                ...data,
                additional_fields: convertAdditionalFields(additionalFieldValues),
                currency
            };

            console.log("🚀 Starting payment processing with payload:", payload);


            if(selectedDepartmentType==="EVENT_BASED"){
                if (data.paymentMethod === "KaspiBank") {
                    if (selectedEventPriced === false) {
                        // Если событие без фиксированной цены, используем эндпоинт event-custom-price
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { paymentMethod, department_id, promo_code, showInUsd, ...customPriceData } = payload;
                        const kaspiData = await orderKaspiCustomPrice({
                            ...customPriceData,
                            event_id: customPriceData.event_id!,
                            amount: customPriceData.amount!,
                            currency: "KZT" // Kaspi только KZT
                        });
                        console.log("kaspiData", kaspiData);
                        setPaymentData(kaspiData);
                    } else {
                        // Если событие с фиксированной ценой, используем обычный эндпоинт
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { paymentMethod, department_id, amount, showInUsd, ...dataWithoutPaymentMethodAndDepartment } = payload;
                        const kaspiData = await orderKaspi({
                            ...dataWithoutPaymentMethodAndDepartment,
                            currency: "KZT" // Kaspi только KZT
                        });
                        console.log("kaspiData", kaspiData);
                        setPaymentData(kaspiData);
                    }
                } else if (data.paymentMethod === "HalykBank") {
                    if (selectedEventPriced === false) {
                        // Если событие без фиксированной цены, используем эндпоинт event-custom-price
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { paymentMethod, department_id, promo_code, showInUsd, ...customPriceData } = payload;
                        console.log("🔍 Calling orderHalykCustomPrice with:", customPriceData);
                        try {
                            const halykData = await orderHalykCustomPrice({
                                ...customPriceData,
                                event_id: customPriceData.event_id!,
                                amount: customPriceData.amount!,
                                currency
                            });
                            console.log("✅ orderHalykCustomPrice success:", halykData);
                            setPaymentData(halykData);
                            setShowWidget(true);
                        } catch (error) {
                            console.error("❌ orderHalykCustomPrice error:", error);
                            toast.error("Ошибка при создании платежа. Пожалуйста, попробуйте еще раз.");
                        }
                    } else {
                        // Если событие с фиксированной ценой, используем обычный эндпоинт
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { paymentMethod, department_id, amount, showInUsd, ...dataWithoutPaymentMethodAndDepartment } = payload;
                        console.log("🔍 Calling orderHalyk with:", dataWithoutPaymentMethodAndDepartment);
                        try {
                            const halykData = await orderHalyk({
                                ...dataWithoutPaymentMethodAndDepartment,
                                currency
                            });
                            console.log("✅ orderHalyk success:", halykData);
                            setPaymentData(halykData);
                            setShowWidget(true);
                        } catch (error) {
                            console.error("❌ orderHalyk error:", error);
                            toast.error("Ошибка при создании платежа. Пожалуйста, попробуйте еще раз.");
                        }
                    }
                }
                else {
                    console.warn("Unknown payment method");
                }
            }else if(selectedDepartmentType==="SELF_PAY"){
                if (data.paymentMethod === "KaspiBank") {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { paymentMethod, event_id, promo_code, showInUsd, ...dataWithoutPaymentMethodAndDepartment } = payload;

                    const kaspiData = await orderSelfKaspi({
                        ...dataWithoutPaymentMethodAndDepartment,
                        currency: "KZT" // Kaspi только KZT
                    });
                    console.log("kaspiData", kaspiData);
                    setPaymentData(kaspiData);

                }else if (data.paymentMethod === "HalykBank") {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { paymentMethod, event_id, promo_code, showInUsd, ...dataWithoutPaymentMethodAndDepartment } = payload;
                    setPaymentData(await orderSelfHalyk({
                        ...dataWithoutPaymentMethodAndDepartment,
                        currency: "KZT" // Self-pay всегда KZT
                    }));
                    setShowWidget(true);
                }
            }

        } catch (err: any) {
            toast.error(err.response.data.detail[0].msg || t('paymentPage.toasts.error'))
            console.error("Payment API error:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => date.toISOString().split("T")[0];


    useEffect(() => {
        const url = paymentData?.redirect_url;
        if (url && typeof url === "string" && url.length > 0) {
            console.log("Redirecting to:", url);
            setTimeout(() => {
                window.location.href = url;
            }, 300);
        }
    }, [paymentData]);



    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-[#FFFFFF] font-medium text-[20px] md:w-[610px] md:px-[94px] px-5  py-[32px] rounded-[6px] border-2 border-[#006799]"
        >
            <p className="mb-[31px] text-[24px]">{t('paymentPage.personalInfo')}</p>
            <div className="flex flex-col md:w-full w-[340px] gap-[20px]">
                <Controller
                    name="fullname"
                    control={control}
                    render={({ field }) => (
                        <>
                            <CustomInput
                                {...field}
                                icon={<UserIcon className={`text-[#6B9AB0] ${errors.fullname ? "text-red-500" : ""}`} />}
                                type="text"
                                onChange={(e) => {
                                    field.onChange(e);
                                    setOrderField("fullname", e.target.value);
                                }}
                                placeholder={t('paymentPage.inputs.namePH')}
                                error={errors.fullname?.message}
                            />
                            {errors.fullname && (
                                <p className="text-red-500 text-sm -mt-4 ml-2">{errors.fullname.message}</p>
                            )}
                        </>
                    )}
                />
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                        <>
                            <CustomInput
                                {...field}
                                icon={<EnvelopeIcon className={`text-[#6B9AB0] ${errors.email ? "text-red-500" : ""}`} />}
                                type="email"
                                onChange={(e) => {
                                    field.onChange(e);
                                    setOrderField("email", e.target.value);
                                }}
                                placeholder={t('paymentPage.inputs.emailPH')}
                                error={errors.email?.message}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm -mt-4 ml-2">{errors.email.message}</p>
                            )}
                        </>
                    )}
                />
                <Controller
                    name="cellphone"
                    control={control}
                    render={({ field }) => (
                        <>
                            <CustomInput
                                {...field}
                                icon={<PhoneIcon className={`text-[#6B9AB0] ${errors.cellphone ? "text-red-500" : ""}`} />}
                                type="text"
                                onChange={(e) => {
                                    field.onChange(e);
                                    setOrderField("cellphone", e.target.value);
                                }}
                                placeholder={t('paymentPage.inputs.phonePH')}
                                error={errors.cellphone?.message}
                            />
                            {errors.cellphone && (
                                <p className="text-red-500 text-sm -mt-4 ml-2">{errors.cellphone.message}</p>
                            )}
                        </>
                    )}
                />
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

                                    // Reset promo code and event when department changes
                                    if (discount > 0) {
                                        setValue("promo_code", null);
                                        resetPromo();
                                        toast("Промокод сброшен. Департамент изменен.", {
                                            icon: "ℹ️"
                                        });
                                    }

                                    // Reset event selection
                                    setValue("event_id", null);
                                    setOrderField("event_id", ""); // Reset in store too
                                    setEventOptions([]); // Clear event options
                                    setSelectedEventPriced(null);
                                    setPrice(0);

                                    // Reset payment category when department changes
                                    setValue("payment_category_id", null);
                                    setOrderField("payment_category_id", ""); // Reset in store too
                                    setPaymentCategoryOptions([]); // Clear payment category options
                                    setPaymentCategoryAdditionalFields([]);
                                    setPaymentCategoryAdditionalFieldValues({});

                                    // Reset residency status
                                    setValue("showInUsd", false);
                                    setCurrency("KZT");

                                    // Reset additional fields
                                    setAdditionalFieldValues({});

                                    type AdditionalFieldsMap = Record<string, { type: string }>;

                                    const selected = departments.find((d) => d.id === val);
                                    setSelectedDepartmentType(selected?.type as DepartmentType || null);
                                    const additional = (selected?.additional_fields || {}) as AdditionalFieldsMap;

                                    const parsed = Object.entries(additional).map(([label, config]) => ({
                                        label,
                                        type: config.type,
                                        name: label.replace(/\s+/g, "_").toLowerCase()
                                    }));
                                    setAdditionalFields(parsed);
                                }}
                                triggerClassName={"text-white"}
                                placeholder={t('paymentPage.inputs.selectDepPH')}
                                error={errors.department_id?.message}
                            />
                            {errors.department_id && (
                                <p className="text-red-500 text-sm -mt-2 ml-2">{errors.department_id.message}</p>
                            )}
                        </>
                    )}
                />

                {selectedDepartmentId && (
                    <>
                        {/* Дополнительные поля департамента */}
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
                            }else if (field.type === "date") {
                                return (
                                    <div key={key} className="ml-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {field.label}
                                        </label>
                                        <input
                                            type="date"
                                            value={
                                                typeof additionalFieldValues[key] === "string" ||
                                                typeof additionalFieldValues[key] === "number"
                                                    ? new Date(additionalFieldValues[key]).toISOString().split('T')[0]
                                                    : ''
                                            }
                                            placeholder={field.label}
                                            onChange={(e) => handleAdditionalChange(key, e.target.value)}
                                        />
                                    </div>
                                );
                            } else if (field.type === "file") {
                                return (
                                    <div key={key} className="ml-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {field.label}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id={`file-${key}`}
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        handleAdditionalChange(key, {
                                                            name: file.name,
                                                            size: file.size,
                                                            type: file.type,
                                                            lastModified: file.lastModified
                                                        });
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById(`file-${key}`)?.click()}
                                                className={`flex items-center justify-center gap-2 rounded-[5px] p-[13px] text-[16px] cursor-pointer select-none border transition-colors w-full text-white bg-[#006799] border-[#6B9AB0] hover:bg-[#004C71] ${(additionalFieldValues[key] as any)?.name ? 'bg-[#006799]' : ''}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <span className="text-sm font-medium">
                                                    {(additionalFieldValues[key] as any)?.name || "Выберите файл"}
                                                </span>
                                            </button>
                                            {(additionalFieldValues[key] as any)?.name && (
                                                <div className="mt-2 text-xs text-gray-600">
                                                    Файл: {(additionalFieldValues[key] as any).name} ({((additionalFieldValues[key] as any).size / 1024).toFixed(1)} KB)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <CustomInput
                                    key={key}
                                    icon={<UserIcon className="text-[#6B9AB0]" />}
                                    type={field.type}
                                    value={additionalFieldValues[key] || ""}
                                    onChange={(e) => handleAdditionalChange(key, e.target.value)}
                                    placeholder={field.label}
                                />
                            );
                        })}

                        {/* Селект событий — всегда доступен при выбранном департаменте */}
                        <>
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

                                                // Reset promo code when event changes
                                                if (discount > 0) {
                                                    setValue("promo_code", null);
                                                    resetPromo();
                                                    toast("Промокод сброшен. Событие изменено.", {
                                                        icon: "ℹ️"
                                                    });
                                                }

                                                // Reset residency status when event changes
                                                setValue("showInUsd", false);
                                                setCurrency("KZT");

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
                                        {errors.event_id && (
                                            <p className="text-red-500 text-sm -mt-2 ml-2">{errors.event_id.message}</p>
                                        )}
                                    </>
                                )}
                            />

                            {/* Дополнительные поля события */}
                            {eventAdditionalFields.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    {eventAdditionalFields.map((field) => {
                                        const key = field.name;
                                        return (
                                            <CustomInput
                                                key={key}
                                                icon={<UserIcon className="text-[#6B9AB0]" />}
                                                type={field.type}
                                                value={eventAdditionalFieldValues[key] || ""}
                                                onChange={(e) => {
                                                    const newValues = {...eventAdditionalFieldValues};
                                                    newValues[key] = e.target.value;
                                                    setEventAdditionalFieldValues(newValues);
                                                }}
                                                placeholder={field.label}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {/* Селект типа платежа */}
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

                                                    // Загружаем дополнительные поля категории платежа
                                                    const selectedCategory = paymentCategoryOptions.find(opt => opt.value === val);
                                                    if (selectedCategory) {
                                                        const categoryData = selectedCategory as any;
                                                        
                                                        // Загружаем дополнительные поля
                                                        if (categoryData.additional_fields) {
                                                            const categoryFields = Object.entries(categoryData.additional_fields).map(([name, config]: [string, any]) => ({
                                                                name,
                                                                type: config.type,
                                                                label: name
                                                            }));
                                                            setPaymentCategoryAdditionalFields(categoryFields);
                                                        } else {
                                                            setPaymentCategoryAdditionalFields([]);
                                                        }
                                                    } else {
                                                        // Очищаем если категория не найдена
                                                        setPaymentCategoryAdditionalFields([]);
                                                    }
                                                }}
                                                triggerClassName={"text-white"}
                                                placeholder={t('paymentPage.inputs.selectPaymentTypePH')}
                                                error={errors.payment_category_id?.message}
                                            />
                                            {errors.payment_category_id && (
                                                <p className="text-red-500 text-sm -mt-2 ml-2">{errors.payment_category_id.message}</p>
                                            )}

                                            {/* Дополнительные поля категории платежа */}
                                            {paymentCategoryAdditionalFields.length > 0 && (
                                                <div className="flex flex-col gap-2 mt-4">
                                                    {paymentCategoryAdditionalFields.map((field) => {
                                                        const key = field.name;
                                                        
                                                        if (field.type === "checkbox") {
                                                            return (
                                                                <label key={key} className="flex items-center gap-2 ml-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={Boolean(paymentCategoryAdditionalFieldValues[key])}
                                                                        onChange={(e) => {
                                                                            const newValues = {...paymentCategoryAdditionalFieldValues};
                                                                            newValues[key] = e.target.checked;
                                                                            setPaymentCategoryAdditionalFieldValues(newValues);
                                                                        }}
                                                                        className="w-4 h-4 rounded accent-[#6B9AB0]"
                                                                    />
                                                                    <span className="text-black">{field.label}</span>
                                                                </label>
                                                            );
                                                        } else if (field.type === "file") {
                                                            return (
                                                                <div key={key} className="ml-2">
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                        {field.label}
                                                                    </label>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="file"
                                                                            id={`payment-file-${key}`}
                                                                            className="hidden"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    const newValues = {...paymentCategoryAdditionalFieldValues};
                                                                                    newValues[key] = {
                                                                                        name: file.name,
                                                                                        size: file.size,
                                                                                        type: file.type,
                                                                                        lastModified: file.lastModified
                                                                                    };
                                                                                    setPaymentCategoryAdditionalFieldValues(newValues);
                                                                                }
                                                                            }}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => document.getElementById(`payment-file-${key}`)?.click()}
                                                                            className={`flex items-center justify-center gap-2 rounded-[5px] p-[13px] text-[16px] cursor-pointer select-none border transition-colors w-full text-white bg-[#006799] border-[#6B9AB0] hover:bg-[#004C71] ${(paymentCategoryAdditionalFieldValues[key] as any)?.name ? 'bg-[#006799]' : ''}`}
                                                                        >
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                            </svg>
                                                                            <span className="text-sm font-medium">
                                                                                {(paymentCategoryAdditionalFieldValues[key] as any)?.name || "Выберите файл"}
                                                                            </span>
                                                                        </button>
                                                                        {(paymentCategoryAdditionalFieldValues[key] as any)?.name && (
                                                                            <div className="mt-2 text-xs text-gray-600">
                                                                                Файл: {(paymentCategoryAdditionalFieldValues[key] as any).name} ({((paymentCategoryAdditionalFieldValues[key] as any).size / 1024).toFixed(1)} KB)
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <CustomInput
                                                                    key={key}
                                                                    icon={<UserIcon className="text-[#6B9AB0]" />}
                                                                    type={field.type}
                                                                    value={paymentCategoryAdditionalFieldValues[key] || ""}
                                                                    onChange={(e) => {
                                                                        const newValues = {...paymentCategoryAdditionalFieldValues};
                                                                        newValues[key] = e.target.value;
                                                                        setPaymentCategoryAdditionalFieldValues(newValues);
                                                                    }}
                                                                    placeholder={field.label}
                                                                />
                                                            );
                                                        }
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}
                                />
                            )}

                            {/* Чекбокс рендерится только для произвольной цены или когда обе цены доступны */}
                            {watchPaymentCategoryId && (() => {
                                const selectedCategory = paymentCategoryOptions.find(opt => opt.value === watchPaymentCategoryId);
                                if (!selectedCategory) return false;
                                const categoryData = selectedCategory as any;
                                const hasBothPrices = categoryData.price > 0 && categoryData.price_usd > 0;
                                const hasCustomPrice = categoryData.price === 0 && categoryData.price_usd === 0;
                                return hasBothPrices || hasCustomPrice;
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
                                                        if (isUsdForced || isKztForced) return; // Блокируем изменение если принудительно
                                                        const isChecked = e.target.checked;
                                                        field.onChange(isChecked);
                                                        
                                                        // Используем цены из выбранной категории платежа
                                                        const selectedCategory = paymentCategoryOptions.find(opt => opt.value === watchPaymentCategoryId);
                                                        if (selectedCategory) {
                                                            const categoryData = selectedCategory as any;
                                                            if (isChecked) {
                                                                setValue("amount", categoryData.price_usd || null);
                                                                setPrice(categoryData.price_usd || 0);
                                                                setCurrency("USD");
                                                            } else {
                                                                setValue("amount", categoryData.price || null);
                                                                setPrice(categoryData.price || 0);
                                                                setCurrency("KZT");
                                                            }
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
                        </>

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
                                        disableKaspi={watchShowInUsd || isKaspiDisabled} // Disable Kaspi if showing in USD or forced disabled
                                    />
                                    {paymentMethodMessage && (
                                        <p className="text-yellow-600 text-sm -mt-2 ml-2">
                                            ⚠️ {paymentMethodMessage}
                                        </p>
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
                        {
                            selectedDepartmentType==="EVENT_BASED" ? (
                                    <>
                                        {selectedEventPriced !== false && (
                                            <Controller
                                                name="promo_code"
                                                control={control}
                                                render={({ field }) => (
                                                    <PromocodeInput promoCodeField={{
                                                        ...field,
                                                        value: field.value ?? undefined
                                                    }} />

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
                                                            disabled={false} // Всегда активно для произвольной цены
                                                            icon={watchShowInUsd 
                                                                ? <CurrencyDollarIcon className={errors.amount ? "text-red-500" : "text-[#6B9AB0]"} />
                                                                : <TengeIcon color={errors.amount ? "#fb2c36" : "#6B9AB0"} />
                                                            }
                                                            type="number"
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                setOrderField("amount", Number(e.target.value));
                                                            }}
                                                            placeholder={isCustomPrice ? "Введите сумму" : t('paymentPage.inputs.amountPH')}
                                                            error={errors.amount?.message}
                                                        />
                                                        {errors.amount && (
                                                            <p className="text-red-500 text-sm -mt-4 ml-2">{errors.amount.message}</p>
                                                        )}
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
                                                            disabled={!isCustomPrice} // Блокируем если не произвольная цена
                                                            icon={watchShowInUsd 
                                                                ? <CurrencyDollarIcon className={errors.amount ? "text-red-500" : "text-[#6B9AB0]"} />
                                                                : <TengeIcon color={errors.amount ? "#fb2c36" : "#6B9AB0"} />
                                                            }
                                                            type="number"
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                setOrderField("amount", Number(e.target.value));
                                                            }}
                                                            placeholder={isCustomPrice ? "Введите сумму" : t('paymentPage.inputs.amountPH')}
                                                            error={errors.amount?.message}
                                                        />
                                                        {errors.amount && (
                                                            <p className="text-red-500 text-sm -mt-4 ml-2">{errors.amount.message}</p>
                                                        )}
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
                                                disabled={!isCustomPrice} // Блокируем если не произвольная цена
                                                icon={<TengeIcon  color={errors.amount ? "#fb2c36" : "#6B9AB0"} />}
                                                type="number"
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    setOrderField("amount", Number(e.target.value));
                                                }}
                                                placeholder={isCustomPrice ? "Введите сумму" : t('paymentPage.inputs.amountPH')}
                                                error={errors.amount?.message}
                                            />
                                            {errors.amount && (
                                                <p className="text-red-500 text-sm -mt-4 ml-2">{errors.amount.message}</p>
                                            )}
                                        </>
                                    )}
                                />
                            )
                        }
                        {!loading ? (
                            <CustomButton 
                                type="submit" 
                                variant="submit"
                                disabled={isCustomPrice && (!watch("amount") || Number(watch("amount")) <= 0)} // Блокируем при произвольной цене без суммы
                                className="bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] px-4 py-2 text-white font-medium rounded-md transition duration-200 ease-in-out shadow-md hover:shadow-lg"
                            >
                                {t('paymentPage.payBtn')}
                            </CustomButton>
                        ) : (
                            <CustomButton 
                                type="submit" 
                                disabled={true} 
                                variant="disabled"
                                className="bg-[#2563EB] px-4 py-2 text-white font-medium rounded-md opacity-75 shadow-md"
                            >
                                <PulseLoader size={6} color={"#ffff"} />
                            </CustomButton>
                        )}
                    </>
                )}

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
            </div>
        </form>
    );
};