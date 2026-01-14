import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const filePathParam = searchParams.get('path');
        let token = searchParams.get('token');

        // Also check header if provided (e.g. if we switch to fetch-based image loading later)
        if (!token) {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token || !verifyToken(token)) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!filePathParam) {
            return new NextResponse('Path required', { status: 400 });
        }

        // Security: prevent directory traversal
        if (filePathParam.includes('..')) {
            return new NextResponse('Invalid path', { status: 400 });
        }

        // Construct absolute path
        // Check multiple potential locations
        const possiblePaths = [
            path.join(process.cwd(), filePathParam),
            path.join(process.cwd(), 'public', filePathParam),
            path.join(process.cwd(), '..', filePathParam), // Sibling directory
            path.join(process.cwd(), '..', 'storage', 'app', filePathParam), // Laravel storage structure
            path.join(process.cwd(), 'storage', 'app', filePathParam),
        ];

        let absolutePath = '';
        let found = false;

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                absolutePath = p;
                found = true;
                break;
            }
        }

        if (!found) {
            console.error(`File not found. Searched in:`, possiblePaths);
            return new NextResponse('File not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(absolutePath);
        const ext = path.extname(absolutePath).toLowerCase();

        let contentType = 'application/octet-stream';
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.pdf') contentType = 'application/pdf';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'private, max-age=3600'
            }
        });
    } catch (error) {
        console.error('Error serving document:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
