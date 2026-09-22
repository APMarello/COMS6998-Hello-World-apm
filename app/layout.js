import "./globals.css";

export const metadata = {
  title: "Best Movies 2000–2010",
  description: "Movies loaded from Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
