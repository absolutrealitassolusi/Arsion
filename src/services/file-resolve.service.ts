import { api } from "@/lib/axios";

export const fileResolveService = {
  async resolveUrls(paths: (string | null)[]): Promise<(string | null)[]> {
    const { data } = await api.post<{ data: (string | null)[] }>("/files/resolve-urls", { paths });
    return data.data;
  },
};
