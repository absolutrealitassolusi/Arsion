import { api } from "@/lib/axios";
import type { CompanyPayload, CompanyResponse } from "@/types/company";

export const companyService = {
  async get(): Promise<CompanyResponse> {
    const { data } = await api.get<CompanyResponse>("/company");
    return data;
  },

  async update(payload: CompanyPayload): Promise<CompanyResponse> {
    const { data } = await api.put<CompanyResponse>("/company", payload);
    return data;
  },
};
