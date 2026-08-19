// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  it("gak nampilin apa-apa kalau open=false", () => {
    render(<ConfirmDialog open={false} onOpenChange={vi.fn()} title="Hapus data?" onConfirm={vi.fn()} />);

    expect(screen.queryByText("Hapus data?")).not.toBeInTheDocument();
  });

  it("nampilin title & description kalau open=true", () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Hapus Payment Voucher ini?"
        description="Data yang dihapus tidak bisa dikembalikan."
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Hapus Payment Voucher ini?")).toBeInTheDocument();
    expect(screen.getByText("Data yang dihapus tidak bisa dikembalikan.")).toBeInTheDocument();
  });

  it("klik tombol confirm manggil onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open onOpenChange={vi.fn()} title="Tolak PV ini?" confirmLabel="Tolak" onConfirm={onConfirm} />
    );

    await user.click(screen.getByRole("button", { name: "Tolak" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("isLoading=true nge-disable tombol confirm", () => {
    render(<ConfirmDialog open onOpenChange={vi.fn()} title="Setujui PV ini?" onConfirm={vi.fn()} isLoading />);

    expect(screen.getByRole("button", { name: "Hapus" })).toBeDisabled();
  });

  it("nampilin children di antara description & tombol aksi", () => {
    render(
      <ConfirmDialog open onOpenChange={vi.fn()} title="Tolak PV ini?" onConfirm={vi.fn()}>
        <p>Alasan Penolakan</p>
      </ConfirmDialog>
    );

    expect(screen.getByText("Alasan Penolakan")).toBeInTheDocument();
  });

  it("confirmDisabled=true nge-disable tombol confirm meski isLoading false", () => {
    render(
      <ConfirmDialog open onOpenChange={vi.fn()} title="Tolak PV ini?" confirmLabel="Tolak" onConfirm={vi.fn()} confirmDisabled />
    );

    expect(screen.getByRole("button", { name: "Tolak" })).toBeDisabled();
  });

  it("label tombol confirm & cancel bisa dikustom", () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Setujui PV ini?"
        confirmLabel="Setujui"
        cancelLabel="Batalkan"
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Setujui" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Batalkan" })).toBeInTheDocument();
  });
});
