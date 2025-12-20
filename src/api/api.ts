import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./utils/tokenUtils.ts";

type FailedRequest = {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
};

let failedQueue: FailedRequest[] = [];
let isRefreshing = false;

const processQueue = (error: unknown, token?: string) => {
    failedQueue.forEach(p => {
        if (error || !token) {
            p.reject(error ?? new Error("Token missing"));
        } else {
            p.resolve(token);
        }
    });
    failedQueue = [];
};

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refresh = getRefreshToken();
                if (!refresh) throw new Error("No refresh token");

                const response = await axios.post(`${API_URL}/auth/login/refresh`, {
                    refresh,
                });

                const { access, refresh: newRefresh } = response.data;

                // если сервер вернул новый refresh, сохраняем его, иначе старый
                setTokens(access, newRefresh ?? refresh);

                api.defaults.headers.common.Authorization = `Bearer ${access}`;
                processQueue(null, access);

                return api(originalRequest);
            } catch (err) {
                processQueue(err, undefined);
                clearTokens();
                window.location.href = "/login";
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
