import { AppHeader } from "@/components/header/app-header";

// Every page in the (app) group gets the header. Login lives in (auth) and doesn't.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
