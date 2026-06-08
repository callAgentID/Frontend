export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: '#ffffff', minHeight: '100vh', width: '100%', overflow: 'auto', position: 'fixed', inset: 0 }}>
      {children}
    </div>
  );
}
