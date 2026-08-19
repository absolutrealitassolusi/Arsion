import "dotenv/config";
import { createPrivateBucketIfMissing } from "@/lib/file-storage";

async function main() {
  console.log("Menyiapkan bucket Supabase Storage...");
  const { created } = await createPrivateBucketIfMissing();
  console.log(created ? "Bucket 'pv-files' (private) berhasil dibuat." : "Bucket 'pv-files' sudah ada, dilewati.");
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
