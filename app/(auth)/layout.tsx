import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-amber-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-xl font-bold text-primary">
            Smart Space Booking
          </Link>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}