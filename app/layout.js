import "./globals.css";
import MotionProvider from "./MotionProvider";

const themeInitializationScript = `
  try {
    const savedTheme = localStorage.getItem("movie-theme");
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : preferredTheme;
  } catch {}
`;

export const metadata = {
  title: "AI Humor App",
  description: "Rate AI-generated memes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body><MotionProvider>{children}</MotionProvider></body>
    </html>
  );
}
