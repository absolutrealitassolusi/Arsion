import { api } from "@/lib/axios";
import type { UploadKind } from "@/lib/file-path";

export const uploadService = {
  async uploadFile(file: Blob, fileName: string, kind: UploadKind): Promise<{ path: string }> {
    const formData = new FormData();
    formData.set("file", file, fileName);
    formData.set("kind", kind);

    // Override Content-Type instance default (application/json) jadi
    // `undefined` - biar browser yang generate header multipart/form-data
    // lengkap dengan boundary-nya sendiri, bukan ke-timpa string statis.
    const { data } = await api.post<{ data: { path: string } }>("/uploads", formData, {
      headers: { "Content-Type": undefined },
    });
    return data.data;
  },
};
