export enum APIPayloadRequestType {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
}

export type APIPayloadType = {
    url: string;
    config: APIReqConfig;
    body?: unknown;
}

export interface APIReqConfig {
    type: APIPayloadRequestType;
    auth?: boolean;
    cache?: boolean;
    cacheTTL?: number;
    absoluteURL?: boolean;
}

export type FetchOptions = {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean>;
    timeout?: number;
};

export type iMakeRequestPayload<B> = {
    token?: string;
    body?: B;
    url: string;
    absoluteURL?: boolean;
    options?: FetchOptions;
    authorized?: boolean;
}

export interface iFetchResponse<R> {
    status: number;
    data: R;
    ok: boolean;
}
