// Login page must NOT be wrapped by AdminLayout (no auth check)
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
