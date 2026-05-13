import "./globals.css";

export const metadata = {
  title: "TWSE 條件選股器",
  description: "上市股票 + 三大法人籌碼 + 財報條件選股"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
