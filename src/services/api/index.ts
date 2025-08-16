import { fetchBaseQuery, FetchArgs } from "@reduxjs/toolkit/query/react";
import { error } from "console";

// Define the RefreshResponse type locally to avoid conflicts
interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    expiresAt: string;
    sessionId?: string;
  };
}

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const setAccessToken = (token: string | null) => {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

const baseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

export const baseQueryWithReauth = async (
  args: string | FetchArgs,
  api: any,
  extraOptions: any
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (
    result?.error &&
    (result.error.status === 401 || result.error.status === "FETCH_ERROR")
  ) {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    const refreshResult = await baseQuery(
      {
        url: "/api/auth/refresh",
        method: "POST",
        body: storedRefreshToken
          ? { refreshToken: storedRefreshToken }
          : undefined,
      },
      api,
      extraOptions
    );

    if (refreshResult?.data) {
      try {
        const data = refreshResult.data as RefreshResponse;
        if (data?.data?.accessToken) {
          setAccessToken(data.data.accessToken);
        }
      } catch (e) {
        console.error("Error occured", e);
      }

      result = await baseQuery(args, api, extraOptions);
    } else {
      clearAuthTokens();
      api.dispatch({ type: "auth/logout/fulfilled" });
    }
  }

  return result;
};
