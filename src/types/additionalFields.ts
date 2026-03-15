export interface FieldLabel {
    kz: string;
    ru: string;
    en: string;
    file?: {
        url: string;
        key: string;
        bucket: string;
        filename: string;
        content_type: string;
        size: number;
    };
}

export type FieldValue = string | number | boolean | {
    file?: {
        url: string;
        key: string;
        bucket: string;
        filename: string;
        content_type: string;
        size: number;
    };
} | null;

export interface AdditionalFieldConfig {
    label: FieldLabel;
    type: "text" | "number" | "date" | "checkbox" | "file";
    required?: boolean;
    value?: any;
}

export interface AdditionalFieldValue {
    label: FieldLabel;
    type: "text" | "number" | "date" | "checkbox" | "file";
    value?: any;
}

export interface MultilingualAdditionalFields {
    [key: string]: {
        label: FieldLabel;
        type: "text" | "number" | "date" | "checkbox" | "file";
        required?: boolean;
        value?: any;
    };
}
