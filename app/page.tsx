// app/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100svh",
        width: "100vw",
        backgroundColor: "black",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Link href="/state" style={{ display: "inline-block" }}>
        <Image
          src="/outflo.jpg"
          alt="Outflō"
          width={320}
          height={320}
          priority
        />
      </Link>
    </main>
  );
}

