import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <Link
      href="https://outflois.vercel.app/state"
      style={{
        display: "block",
        minHeight: "0vh",
        gridTemplateRows: "1fr auto 2fr",
        backgroundColor: "black",
      }}
    >
      <main
        style={{
          minHeight: "0vh",
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


