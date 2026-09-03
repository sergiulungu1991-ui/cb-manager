import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Chaturbate Manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={cn("font-sans", inter.variable)}>
      <body className='bg-[#f0f1f2] text-gray-800 min-h-screen'>{children}</body>
    </html>
  )
}