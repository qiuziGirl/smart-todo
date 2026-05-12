import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && !!key && !url.includes("your-project") && key !== "your-anon-key";
}

/**
 * 在 Next.js 16 的 proxy（中间件）中刷新 Supabase 会话 cookie。
 * 必须在每个请求上调用，否则 access_token 过期后无法自动续期。
 * 若环境变量未配置（M0 占位阶段），跳过刷新，让请求继续。
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: 必须调用 getUser() 触发 token 刷新；不要替换为 getSession()。
  await supabase.auth.getUser();

  return response;
}
