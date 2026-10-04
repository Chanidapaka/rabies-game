import type { Metadata } from 'next';
import { Prompt, Sarabun } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';

const prompt = Prompt({ subsets: ['thai', 'latin'], weight: ['500', '700'], variable: '--font-head', display: 'swap' });
const sarabun = Sarabun({ subsets: ['thai', 'latin'], weight: ['400', '600'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: 'ล้างแผลทัน — เกมจำลองสถานการณ์โรคพิษสุนัขบ้า',
  description: 'ฝึกตัดสินใจเมื่อถูกสัตว์กัด 5 ด่าน ตั้งแต่ปฐมพยาบาลจนถึงฉีดวัคซีนครบ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${prompt.variable} ${sarabun.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
        <footer className="container muted" style={{ paddingBlock: '2rem', fontSize: '.9rem' }}>
          เนื้อหาในเกมใช้เพื่อการเรียนรู้เท่านั้น ไม่ใช่คำแนะนำทางการแพทย์ หากถูกสัตว์กัดหรือข่วน ควรไปพบแพทย์ทันที
        </footer>
      </body>
    </html>
  );
}
