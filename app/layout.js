import "./globals.css";
import MotionProvider from "./MotionProvider";

export const metadata = {
  title: "AI Humor App",
  description: "Rate AI-generated memes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><MotionProvider>{children}</MotionProvider></body>
    </html>
  );
}
