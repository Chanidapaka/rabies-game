import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ป้องกันหน้าที่ต้องล็อกอิน (ตรวจสิทธิ์ admin ละเอียดอีกครั้งในหน้า/ API)
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('rg_session')?.value;
  let valid = false;
  if (token && process.env.JWT_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      valid = true;
    } catch {
      valid = false;
    }
  }
  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/play/:path*', '/dashboard/:path*'] };
