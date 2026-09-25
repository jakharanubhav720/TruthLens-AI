import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'TruthLens AI - Disinformation & Deepfake Detection Engine',
  description: 'Clinical-grade deepfake and disinformation analysis for social platforms and digital media.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070a0f] min-h-screen flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
