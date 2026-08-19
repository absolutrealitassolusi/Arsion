// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Combobox } from "./combobox";

const options = ["PT Sumber Makmur", "CV Cipta Karya", "PT Maju Bersama"];

describe("Combobox", () => {
  it("ngetik nyaring daftar saran sesuai yang diketik (case-insensitive)", async () => {
    const user = userEvent.setup();
    render(<Combobox value="" onChange={vi.fn()} options={options} placeholder="Ketik..." />);

    const input = screen.getByPlaceholderText("Ketik...");
    await user.click(input);
    await user.type(input, "sumber");

    expect(screen.getByText("PT Sumber Makmur")).toBeInTheDocument();
    expect(screen.queryByText("CV Cipta Karya")).not.toBeInTheDocument();
  });

  it("klik saran manggil onChange dengan value itu, dropdown ketutup sesudahnya", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox value="" onChange={onChange} options={options} placeholder="Ketik..." />);

    const input = screen.getByPlaceholderText("Ketik...");
    await user.click(input);
    await user.type(input, "Sumber");
    await user.click(screen.getByText("PT Sumber Makmur"));

    expect(onChange).toHaveBeenCalledWith("PT Sumber Makmur");
    expect(screen.queryByText("PT Sumber Makmur")).not.toBeInTheDocument();
  });

  it("nampilin opsi 'Tambah' pas ngetik nama yang belum ada, klik itu manggil onCreateOption & onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCreateOption = vi.fn();
    render(
      <Combobox
        value=""
        onChange={onChange}
        options={options}
        onCreateOption={onCreateOption}
        createLabel={(v) => `+ Tambah "${v}" sebagai vendor baru`}
        placeholder="Ketik..."
      />
    );

    const input = screen.getByPlaceholderText("Ketik...");
    await user.click(input);
    await user.type(input, "Vendor Baru XYZ");

    const createButton = screen.getByText('+ Tambah "Vendor Baru XYZ" sebagai vendor baru');
    await user.click(createButton);

    expect(onCreateOption).toHaveBeenCalledWith("Vendor Baru XYZ");
    expect(onChange).toHaveBeenCalledWith("Vendor Baru XYZ");
  });

  it("gak nampilin opsi 'Tambah' kalau prop onCreateOption gak dikasih", async () => {
    const user = userEvent.setup();
    render(<Combobox value="" onChange={vi.fn()} options={options} placeholder="Ketik..." />);

    const input = screen.getByPlaceholderText("Ketik...");
    await user.click(input);
    await user.type(input, "Nama Yang Gak Ada");

    expect(screen.queryByText(/Tambah/)).not.toBeInTheDocument();
  });

  it("gak nampilin opsi 'Tambah' kalau teksnya persis sama dengan salah satu option (exact match)", async () => {
    const user = userEvent.setup();
    render(
      <Combobox value="" onChange={vi.fn()} options={options} onCreateOption={vi.fn()} placeholder="Ketik..." />
    );

    const input = screen.getByPlaceholderText("Ketik...");
    await user.click(input);
    await user.type(input, "PT Sumber Makmur");

    expect(screen.queryByText(/^\+ Tambah/)).not.toBeInTheDocument();
  });
});
