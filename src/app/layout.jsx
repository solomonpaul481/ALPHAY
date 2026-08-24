import "./globals.css";

export const metadata = {
  title: "ALPHAY — Order at your table",
  description: "Scan the table QR code, browse the live menu, and pay digitally.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#15426cff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream font-body text-ink">{children}</body>
    </html>
  );
}
