import "./globals.css";

export const metadata = {
  title: "GM Enterprise",
  description: "C&F and Shipping Agent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}