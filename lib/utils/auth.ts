// utils/auth.ts
export const isAuthRoute = (pathname: string) => {
    return pathname.startsWith('/auth')
  }