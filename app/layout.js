import "./globals.css";

export const metadata = {
  title: "AI Humor App",
  description: "Rate AI-generated memes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
