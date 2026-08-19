export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-4 print:hidden">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Arsion. Seluruh hak cipta dilindungi.</p>
        <p>Versi 1.0.0 · Enterprise Suite</p>
      </div>
    </footer>
  );
}
