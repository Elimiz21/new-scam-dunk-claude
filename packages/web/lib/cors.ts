import { NextResponse } from 'next/server';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function corsResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { 
    status, 
    headers: corsHeaders 
  });
}

export function corsOptionsResponse() {
  return new NextResponse(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}