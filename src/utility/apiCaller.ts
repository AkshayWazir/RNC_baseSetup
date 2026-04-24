import CONSTANTS from "../config/environment";
import { FetchOptions, iFetchResponse, iMakeRequestPayload } from "./types";

let tokenRefreshActive: Promise<boolean> | null = null;

// TODO replace it with real API 
function refreshAuthToken(): Promise<boolean> {
    return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
}

// TODO replace it with real API 
function fetchActiveToken(): Promise<string | null> {
    return new Promise((resolve) => setTimeout(() => resolve("newly_refreshed_token"), 1000));
}

export async function httpRequest<B, R>(url: string, options: FetchOptions = {}, body?: B): Promise<iFetchResponse<R>> {
    const { method = "GET", headers = {}, query, timeout } = options;

    const urlObj = new URL(url);
    if (query) Object.entries(query).forEach(([key, value]) => urlObj.searchParams.append(key, String(value)));

    const controller = new AbortController();
    const timeoutId = timeout && setTimeout(() => controller.abort(), timeout);

    const requestBody: string = JSON.stringify(body);

    try {
        const res = await fetch(urlObj.toString(), { method, headers, body: requestBody, signal: controller.signal, keepalive: false });
        const contentType = res.headers.get("content-type");
        let data: R[] = [];

        if (contentType?.includes("application/json")) data.push(await res.json());
        else throw new Error("Unsupported content type: " + contentType);

        return { ok: res.ok, status: res.status, data: data[0] };
    } catch (error) {
        throw new Error("Failed to fetch data");
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

async function refreshTokenOnce(): Promise<boolean | null> {
    if (!tokenRefreshActive) {
        tokenRefreshActive = refreshAuthToken().catch(() => false).finally(() => tokenRefreshActive = null);
    }
    return tokenRefreshActive;
}

function genConfig(token?: string | undefined) {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return { headers };
}

export function makeRequest<R, B>(payload: iMakeRequestPayload<B>) {
    const finalConfig: FetchOptions = genConfig(payload.token);
    const url = payload.absoluteURL ? payload.url : `${CONSTANTS.BASE_URL}${payload.url}`;
    return {
        get: (): Promise<iFetchResponse<R>> => httpRequest(url, finalConfig),
        put: (): Promise<iFetchResponse<R>> => httpRequest(url, finalConfig, payload.body),
        post: (): Promise<iFetchResponse<R>> => httpRequest(url, finalConfig, payload.body),
        delete: (): Promise<iFetchResponse<R>> => httpRequest(url, finalConfig),
    };
}

export const swrFetcher = async ([url, options]: [string, any]) => {
    const res = await apiCaller<any, any>({ url, absoluteURL: options.absoluteURL });
    if (!res.ok) throw new Error(res?.data?.message || "Request failed");
    return res.data;
};

export function getSWRKey(payload: iMakeRequestPayload<any>) {
    return [payload.url, { method: payload.options?.method || "GET", query: payload.options?.query, token: payload.token }];
}

async function apiCaller<R, B>(apiPayload: iMakeRequestPayload<B>): Promise<iFetchResponse<R>> {
    return await apiCallProcessor<R, B>(apiPayload);
}

async function apiCallProcessor<R, B>(apiPayload: iMakeRequestPayload<B>): Promise<iFetchResponse<R>> {
    let i = 0, response: iFetchResponse<R> = {} as iFetchResponse<R>;
    while (i < 3) {
        try {
            switch (apiPayload.options?.method?.toUpperCase() || "GET") {
                case "GET":
                    response = await makeRequest<R, B>(apiPayload).get();
                    break;
                case "POST":
                    response = await makeRequest<R, B>(apiPayload).post();
                    break;
                case "DELETE":
                    response = await makeRequest<R, B>(apiPayload).delete();
                    break;
                case "PUT":
                    response = await makeRequest<R, B>(apiPayload).put();
                    break;
                default:
                    response = { data: null, ok: false, status: 500 } as iFetchResponse<R>;
            }
        } catch (error: unknown) {
            response = { data: null, ok: false, status: 500 } as iFetchResponse<R>;
        }
        if (response.status === 401) {
            await refreshTokenOnce();
            i++;
            continue;
        } else return response !== null ? response : Promise.reject("No response from server");
    }
    return response !== null ? response : Promise.reject("No response from server");
}

export { apiCaller, apiCallProcessor };
