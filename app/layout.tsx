import type {Metadata} from 'next';
export const metadata:Metadata={title:'BeautyWallet | بیوتی والت',description:'پروفایل پوست، روتین کوتاه، بررسی خرید و پیگیری نتیجه',icons:{icon:'/favicon.ico',apple:[{url:'/legacy/apple-touch-icon-180-v27.png',sizes:'180x180'}]}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fa" dir="rtl"><body style={{margin:0}}>{children}</body></html>}
