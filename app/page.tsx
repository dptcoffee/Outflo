import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <Link
      href="/state"
      style={{
        display: "block",
        minHeight: "100vh",
        backgroundColor: "black",
      }}
    >
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          src="/outflo.jpg"
          alt="Outflō"
          width={320}
          height={320}
          priority
        />
      </main>
    </Link>
  );
}


