// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilePreviewThumbnails } from "./file-preview-thumbnails";

describe("FilePreviewThumbnails", () => {
  it("gak render apa-apa kalau urls kosong", () => {
    const { container } = render(<FilePreviewThumbnails urls={[]} altPrefix="Preview lampiran" />);
    expect(container.firstChild).toBeNull();
  });

  it("render satu <img> per url, dengan alt text 'halaman N' berurutan", () => {
    render(
      <FilePreviewThumbnails
        urls={["data:image/png;base64,AAA", "data:image/png;base64,BBB"]}
        altPrefix="Preview lampiran"
      />
    );

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("alt", "Preview lampiran halaman 1");
    expect(images[1]).toHaveAttribute("alt", "Preview lampiran halaman 2");
  });

  it("src tiap gambar sesuai urutan url yang dikasih", () => {
    render(<FilePreviewThumbnails urls={["url-a", "url-b"]} altPrefix="Preview" />);

    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("src", "url-a");
    expect(images[1]).toHaveAttribute("src", "url-b");
  });
});
