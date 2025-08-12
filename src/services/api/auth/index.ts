import {
  createApi,

} from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, clearAuthTokens, setAccessToken } from "..";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth"],
  endpoints: (build) => ({
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "/api/auth/login",
        method: "POST",
        body,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.accessToken) {
            setAccessToken(data.data.accessToken);
          }
        } catch {
          // ignore
        }
      },
      invalidatesTags: ["Auth"],
    }),

    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: "/api/auth/register/patient",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    logout: build.mutation<{ success: boolean; message?: string }, void>({
      query: () => ({
        url: "/api/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          clearAuthTokens();
        }
      },
      invalidatesTags: ["Auth"],
    }),

    refresh: build.mutation<RefreshResponse, { refreshToken?: string } | void>({
      query: (body) => ({
        url: "/api/auth/refresh",
        method: "POST",
        body,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.accessToken) setAccessToken(data.data.accessToken);
        } catch {
          clearAuthTokens();
        }
      },
    }),

    forgotPassword: build.mutation<
      { success: boolean; message?: string; data?: { expiresAt?: string } },
      PasswordResetRequest
    >({
      query: (body) => ({
        url: "/api/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    resetPassword: build.mutation<
      {
        success: boolean;
        message?: string;
        data?: { userId?: string; email?: string; passwordChangedAt?: string };
      },
      ResetPasswordRequest
    >({
      query: (body) => ({
        url: "/api/auth/reset-password",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    changePassword: build.mutation<
      {
        success: boolean;
        message?: string;
        data?: { userId?: string; email?: string; passwordChangedAt?: string };
      },
      ChangePasswordRequest
    >({
      query: (body) => ({
        url: "/api/auth/change-password",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    getMfaSetup: build.query<
      {
        success: boolean;
        data: { mfaSecret: string; qrCodeUrl: string };
        message?: string;
      },
      void
    >({
      query: () => ({
        url: "/api/auth/setup-mfa",
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),

    verifyEnableMfa: build.mutation<
      {
        success: boolean;
        message?: string;
        data?: { userId?: string; email?: string; mfaEnabled?: boolean };
      },
      { mfaCode: string }
    >({
      query: (body) => ({
        url: "/api/auth/setup-mfa",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    testAuth: build.query<{ success: boolean; message?: string }, void>({
      query: () => ({ url: "/api/auth/test", method: "GET" }),
      providesTags: ["Auth"],
    }),

    testRole: build.query<{ success: boolean; message?: string }, void>({
      query: () => ({ url: "/api/auth/test?path=role", method: "GET" }),
      providesTags: ["Auth"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetMfaSetupQuery,
  useVerifyEnableMfaMutation,
  useTestAuthQuery,
  useTestRoleQuery,
} = authApi;


