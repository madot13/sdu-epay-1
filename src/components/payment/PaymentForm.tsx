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
import {getPublicEventsById} from "@/api/endpoints/events.ts";
import {IEvent} from "@/types/events.ts";
import {usePaymentStore} from "@/store/usePaymentStore.ts";
import {orderHalyk, orderKaspi, orderSelfHalyk, orderSelfKaspi, orderKaspiCustomPrice, orderHalykCustomPrice} from "@/api/endpoints/order.ts";
import {PaymentHalyk} from "@/components/payment/PaymentHalyk.tsx";
import {toast} from "react-hot-toast";
import {Calendar} from "primereact/calendar";
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
    additional: string;
    paymentMethod: string;
    amount: number | null;
    residencyStatus: "resident" | "non-resident" | null;
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
        additional: yup.string().optional(),
        paymentMethod: yup.string().required(t("paymentPage.errors.paymentMethod")),
        amount: departmentType === "SELF_PAY" || (departmentType === "EVENT_BASED" && eventPriced === false)
            ? yup.number().typeError(t("paymentPage.errors.amount")).required(t("paymentPage.errors.amount"))
            : yup.number().nullable().optional(),
        residencyStatus: yup.string().nullable().optional(),
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
    const [departments, setDepartments] = useState<any[]>([]); // store all data
    const [additionalFields, setAdditionalFields] = useState<any[]>([]);
    const [additionalFieldValues, setAdditionalFieldValues] = useState<Record<string, string | boolean>>({});
    const [selectedDepartmentType, setSelectedDepartmentType] = useState<DepartmentType | null>(null);
    const [selectedEventPriced, setSelectedEventPriced] = useState<boolean | null>(null);
    const [selectedEventPriceUsd, setSelectedEventPriceUsd] = useState<number | null>(null);
    const [selectedEventPriceKzt, setSelectedEventPriceKzt] = useState<number | null>(null);




    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const data = await getPublicDepartments();
                setDepartments(data);

                const mapped = data.map((dept: { name: string; id: string }) => ({
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
                })).filter(event => event.label && event.value);
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
            additional: '',
            promo_code: null,
            paymentMethod: '',
            amount: null,
            residencyStatus: "resident"
        }
    });

    const watchResidencyStatus = watch("residencyStatus");
    const watchPaymentMethod = watch("paymentMethod");

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
        if (data.paymentMethod === "KaspiBank" && data.residencyStatus === "non-resident") {
            toast.error("Kaspi Bank does not support USD payments. Please select HalykBank for non-resident payments or change to Resident.");
            return;
        }

        setLoading(true);
        try {
            // Determine currency based on payment method and residency status
            let currency: "KZT" | "USD" = "KZT";
            if (data.paymentMethod === "HalykBank" && data.residencyStatus === "non-resident") {
                currency = "USD";
            }

            const payload = {
                ...data,
                additional_fields: additionalFieldValues,
                currency
            };


            if(selectedDepartmentType==="EVENT_BASED"){
                if (data.paymentMethod === "KaspiBank") {
                    if (selectedEventPriced === false) {
                        // Если событие без фиксированной цены, используем эндпоинт event-custom-price
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { paymentMethod, department_id, promo_code, residencyStatus, ...customPriceData } = payload;
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
                        const { paymentMethod, department_id, amount, residencyStatus, ...dataWithoutPaymentMethodAndDepartment } = payload;
                        const kaspiData = await orderKaspi({
                            ...dataWithoutPaymentMethodAndDepartment,
                            currency: "KZT" // Kaspi только KZT
                        });
                        console.log("kaspiData", kaspiData);
                        setPaymentData(kaspiData);
                    }
                }else if (data.paymentMethod === "HalykBank") {
                    if (selectedEventPriced === false) {
                        // Если событие без фиксированной цены, используем эндпоинт event-custom-price
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { paymentMethod, department_id, promo_code, residencyStatus, ...customPriceData } = payload;
                        setPaymentData(await orderHalykCustomPrice({
                            ...customPriceData,
                            event_id: customPriceData.event_id!,
                            amount: customPriceData.amount!,
                            currency
                        }));
                        setShowWidget(true);
                    } else {
                        // Если событие с фиксированной ценой, используем обычный эндпоинт
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { paymentMethod, department_id, amount, residencyStatus, ...dataWithoutPaymentMethodAndDepartment } = payload;
                        setPaymentData(await orderHalyk({
                            ...dataWithoutPaymentMethodAndDepartment,
                            currency
                        }));
                        setShowWidget(true);
                    }
                }
                else {
                    console.warn("Unknown payment method");
                }
            }else if(selectedDepartmentType==="SELF_PAY"){
                if (data.paymentMethod === "KaspiBank") {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { paymentMethod, event_id, promo_code, residencyStatus, ...dataWithoutPaymentMethodAndDepartment } = payload;

                    const kaspiData = await orderSelfKaspi({
                        ...dataWithoutPaymentMethodAndDepartment,
                        currency: "KZT" // Kaspi только KZT
                    });
                    console.log("kaspiData", kaspiData);
                    setPaymentData(kaspiData);

                }else if (data.paymentMethod === "HalykBank") {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { paymentMethod, event_id, promo_code, residencyStatus, ...dataWithoutPaymentMethodAndDepartment } = payload;
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
                                    setSelectedEventPriceKzt(null);
                                    setSelectedEventPriceUsd(null);
                                    setPrice(0);

                                    // Reset residency status
                                    setValue("residencyStatus", null);
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
                        {selectedDepartmentType==="EVENT_BASED" ? (
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

                                                    // Reset promo code when event changes
                                                    if (discount > 0) {
                                                        setValue("promo_code", null);
                                                        resetPromo();
                                                        toast("Промокод сброшен. Событие изменено.", {
                                                            icon: "ℹ️"
                                                        });
                                                    }

                                                    // Reset residency status when event changes
                                                    setValue("residencyStatus", null);
                                                    setCurrency("KZT");

                                                    const selectedEvent = eventOptions.find(e => e.value === val);
                                                    if (selectedEvent && "price" in selectedEvent) {
                                                        setPrice(Number((selectedEvent as IEvent).price));
                                                        setSelectedEventPriced((selectedEvent as any).priced ?? true);
                                                        setSelectedEventPriceKzt(Number((selectedEvent as any).price || 0));
                                                        setSelectedEventPriceUsd((selectedEvent as any).price_usd || null);
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
                                <Controller
                                    name="residencyStatus"
                                    control={control}
                                    render={({ field }) => {
                                        const residencyOptions = [
                                            { label: t('paymentPage.residency.resident'), value: "resident" },
                                            { label: t('paymentPage.residency.nonResident'), value: "non-resident" }
                                        ];

                                        const handleResidencyChange = (val: string) => {
                                            field.onChange(val);
                                            // Auto-fill amount and currency based on residency status
                                            if (selectedEventPriced) {
                                                if (val === "resident") {
                                                    setValue("amount", selectedEventPriceKzt);
                                                    setPrice(selectedEventPriceKzt || 0);
                                                    setCurrency("KZT");
                                                } else if (val === "non-resident") {
                                                    if (selectedEventPriceUsd) {
                                                        setValue("amount", selectedEventPriceUsd);
                                                        setPrice(selectedEventPriceUsd || 0);
                                                        setCurrency("USD");
                                                    } else {
                                                        // Fallback to KZT price if USD not available
                                                        toast.error("USD price not available for this event. Using KZT price instead.");
                                                        setValue("amount", selectedEventPriceKzt);
                                                        setPrice(selectedEventPriceKzt || 0);
                                                        setCurrency("KZT");
                                                    }
                                                }
                                            }
                                        };

                                        return (
                                            <>
                                                <CustomSelect
                                                    {...field}
                                                    options={residencyOptions}
                                                    value={field.value || ''}
                                                    onChange={handleResidencyChange}
                                                    triggerClassName={"text-white"}
                                                    placeholder={t('paymentPage.residency.resident')}
                                                />
                                                {field.value === "non-resident" && !selectedEventPriceUsd && selectedEventPriced && (
                                                    <p className="text-yellow-600 text-sm -mt-2 ml-2">
                                                        ⚠️ USD price not available. KZT price will be used.
                                                    </p>
                                                )}
                                            </>
                                        );
                                    }}
                                />
                            </>
                        ): null}
                        {additionalFields.map((field) => {
                            const key = field.name;

                            if (field.type === "checkbox") {
                                return (
                                    <label key={key} className="flex items-center gap-2 ml-2">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(additionalFieldValues[key])}
                                            onChange={(e) => handleAdditionalChange(key, e.target.checked)}
                                        />
                                        <span>{field.label}</span>
                                    </label>
                                );
                            }else if (field.type === "date") {
                                return (
                                    <Calendar
                                        value={
                                            typeof additionalFieldValues[key] === "string" ||
                                            typeof additionalFieldValues[key] === "number"
                                                ? new Date(additionalFieldValues[key])
                                                : null
                                        }
                                        dateFormat="yy-mm-dd"
                                        placeholder={field.label}
                                        onChange={(e) => handleAdditionalChange(key, e.value)}
                                    />
                                )
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
                        <Controller
                            name="paymentMethod"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <PaymentMethod
                                        {...field}
                                        error={errors.paymentMethod?.message}
                                        onChange={(value) => setValue("paymentMethod", value)}
                                    />
                                    {errors.paymentMethod && (
                                        <p className="text-red-500 text-sm -mt-2 ml-2">{errors.paymentMethod.message}</p>
                                    )}
                                    {watchResidencyStatus === "non-resident" && watchPaymentMethod === "KaspiBank" && (
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
                                                            icon={watchResidencyStatus === "non-resident"
                                                                ? <CurrencyDollarIcon className={errors.amount ? "text-red-500" : "text-[#6B9AB0]"} />
                                                                : <TengeIcon color={errors.amount ? "#fb2c36" : "#6B9AB0"} />
                                                            }
                                                            type="number"
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                setOrderField("amount", Number(e.target.value));
                                                            }}
                                                            placeholder={t('paymentPage.inputs.amountPH')}
                                                            error={errors.amount?.message}
                                                        />
                                                        {errors.amount && (
                                                            <p className="text-red-500 text-sm -mt-4 ml-2">{errors.amount.message}</p>
                                                        )}
                                                    </>
                                                )}
                                            />
                                        )}

                                        {selectedEventPriced !== false && <CheckOut />}
                                    </>
                            ) : (
                                <Controller
                                    name="amount"
                                    control={control}
                                    render={({ field }) => (
                                        <>
                                            <CustomInput
                                                {...field}
                                                icon={<TengeIcon  color={errors.amount ? "#fb2c36" : "#6B9AB0"} />}
                                                type="number"
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    setOrderField("amount", Number(e.target.value));
                                                }}
                                                placeholder={t('paymentPage.inputs.amountPH')}
                                                error={errors.cellphone?.message}
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
                            <CustomButton type="submit" variant="submit">{t('paymentPage.payBtn')}</CustomButton>
                        ) : (
                            <CustomButton type="submit" disabled={true} variant="disabled">
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
