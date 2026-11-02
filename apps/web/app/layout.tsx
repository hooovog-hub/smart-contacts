export const metadata = { title: "Smart Contacts" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, background: "#000", color: "#F5F5F7", fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
