import "./globals.css";

export const metadata = {
  title: "Best Films, 1990s–2020s",
  description: "Movies loaded from Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
