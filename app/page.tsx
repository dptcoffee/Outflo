import Image from "next/image";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        display: "grid",
        placeItems: "center",
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
  );
}


