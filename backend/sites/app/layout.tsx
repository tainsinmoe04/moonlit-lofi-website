import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { icons: { icon: [{url:'/media/logo.png',type:'image/png'}], apple: '/media/logo.png' }, title: 'Moonlit Lofi — A quieter place', description: 'Fantasy cello, soft beats, and a little room to breathe. Listen to Moonlit Lofi.' };
export default function Layout({children}: {children: React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
