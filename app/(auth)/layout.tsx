export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full min-h-screen px-5 z-10">
      <div className="flex flex-col pt-28 pb-10 items-center max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}
