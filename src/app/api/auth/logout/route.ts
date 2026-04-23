import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ sucesso: true });
  response.cookies.delete("token");
  return response;
}
