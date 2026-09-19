import { Builder } from "@/components/builder";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col p-4 sm:p-6 lg:h-dvh lg:overflow-hidden">
      <Builder />
    </main>
  );
}
