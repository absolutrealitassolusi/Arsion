import { useState } from "react";
import { authService } from "@/services/auth.service";
import type { ForgotPasswordValues, LoginValues } from "@/schemas/auth.schema";

export function useAuth() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);

  const login = async (values: LoginValues) => {
    setIsLoggingIn(true);
    try {
      return await authService.login(values);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const requestPasswordReset = async (values: ForgotPasswordValues) => {
    setIsRequestingReset(true);
    try {
      return await authService.requestPasswordReset(values);
    } finally {
      setIsRequestingReset(false);
    }
  };

  return { login, isLoggingIn, logout, isLoggingOut, requestPasswordReset, isRequestingReset };
}
