export interface FieldLabel {
    kz: string;
    ru: string;
    en: string;
}

export interface AdditionalFieldConfig {
    label: FieldLabel;
    type: "text" | "number" | "date" | "checkbox" | "file";
    required?: boolean;
    value?: any;
}

export interface AdditionalFieldValue {
    label: FieldLabel;
    type: string;
    value?: any;
}

export interface MultilingualAdditionalFields {
    [key: string]: {
        label: FieldLabel;
        type: string;
        required?: boolean;
        value?: any;
    };
}
