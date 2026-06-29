import { createFileRoute } from "@tanstack/react-router";
import { config, site, whatsappLink, type SiteContent } from "@/content/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${config.nome} | Fotografia Premium` },
      { name: "description", content: config.subtitulo },
      { property: "og:title", content: `${config.nome} | Fotografia Premium` },
      { property: "og:description", content: config.subtitulo },
      { property: "og:image", content: site.hero.image },
    ],
  }),
  component: Index,
});

const SERIF = { fontFamily: "var(--font-serif)" } as const;
const SANS = { fontFamily: "var(--font-sans)" } as const;
const BEIGE = "#f7f1e8";
const BEIGE_DEEP = "#ede3d2";
const BROWN = "#3b2a1d";
const BROWN_SOFT = "#6b5443";
const GOLD = "#c9a96a";
const fallback = "/placeholder.jpg";

function safeImage(src: string) {
  return src.trim() ? src : fallback;
}

function Index() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: BEIGE, color: BROWN, ...SANS }}>
      <Nav content={site} />
      <Hero content={site} />
      <Portfolio content={site} />
      <About content={site} />
      <Services content={site} />
      <FinalCta content={site} />
      <Footer content={site} />
    </div>
  );
}

function Nav({ content }: { content: SiteContent }) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{ backgroundColor: "rgba(59,42,29,0.42)", borderBottom: "1px solid rgba(247,241,232,0.08)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <a href="#top" className="text-lg uppercase tracking-[0.28em]" style={{ color: BEIGE, ...SERIF }}>
          {content.brand.name}
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {content.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[11px] uppercase tracking-[0.3em] transition-opacity hover:opacity-70"
              style={{ color: "rgba(247,241,232,0.78)" }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <WhatsappButton href={whatsappLink} label="WhatsApp" light />
      </div>
    </header>
  );
}

function Hero({ content }: { content: SiteContent }) {
  return (
    <section id="top" className="relative min-h-screen overflow-hidden">
      <img
        src={safeImage(content.hero.image)}
        alt={content.hero.title}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(59,42,29,0.58) 0%, rgba(59,42,29,0.42) 42%, rgba(59,42,29,0.82) 100%)",
        }}
      />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pb-20 pt-28 text-center">
        <span className="text-[10px] uppercase tracking-[0.48em]" style={{ color: GOLD }}>
          {content.hero.eyebrow}
        </span>
        <h1
          className="mt-7 text-5xl leading-[0.92] sm:text-6xl md:text-7xl lg:text-8xl"
          style={{ ...SERIF, color: BEIGE, fontWeight: 300 }}
        >
          {content.hero.title}
        </h1>
        <p
          className="mt-7 max-w-2xl text-base leading-relaxed sm:text-lg"
          style={{ color: "rgba(247,241,232,0.86)" }}
        >
          {content.hero.subtitle}
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <WhatsappButton href={content.hero.cta.href} label={content.hero.cta.label} large />
          <WhatsappButton href={whatsappLink} label="Quero um orcamento" large light />
        </div>
      </div>
    </section>
  );
}

function Portfolio({ content }: { content: SiteContent }) {
  return (
    <section id="portfolio" className="px-6 py-24 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={content.portfolio.eyebrow}
          title={content.portfolio.title}
          description={content.portfolio.description}
        />
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.portfolio.items.map((item) => (
            <a
              key={item.id}
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-[2rem]"
              style={{ backgroundColor: BEIGE_DEEP }}
            >
              <div className="relative">
                <img
                  src={safeImage(item.src)}
                  alt={item.title}
                  className="h-80 w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04] sm:h-96"
                />
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: "linear-gradient(180deg, rgba(59,42,29,0) 38%, rgba(59,42,29,0.82) 100%)" }}
                />
                <div className="absolute inset-x-0 bottom-0 translate-y-4 px-5 py-6 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="text-[10px] uppercase tracking-[0.35em]" style={{ color: GOLD }}>
                    {item.category}
                  </div>
                  <h3 className="mt-2 text-2xl" style={{ ...SERIF, color: BEIGE, fontWeight: 400 }}>
                    {item.title}
                  </h3>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function About({ content }: { content: SiteContent }) {
  return (
    <section id="sobre" className="px-6 py-24 lg:px-10 lg:py-32" style={{ backgroundColor: BEIGE_DEEP }}>
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-18">
        <div className="overflow-hidden rounded-[2.2rem] shadow-[0_30px_80px_-36px_rgba(59,42,29,0.35)]">
          <img
            src={safeImage(content.about.image)}
            alt={content.brand.name}
            className="aspect-[4/5] w-full object-cover object-center"
          />
        </div>
        <div>
          <SectionHeader eyebrow={content.about.eyebrow} title={content.about.title} align="left" />
          <p className="mt-8 max-w-2xl text-lg leading-relaxed" style={{ color: BROWN_SOFT }}>
            {content.about.description}
          </p>
          <div className="mt-10">
            <WhatsappButton href={whatsappLink} label={content.about.ctaLabel} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Services({ content }: { content: SiteContent }) {
  return (
    <section id="servicos" className="px-6 py-24 lg:px-10 lg:py-32" style={{ backgroundColor: BROWN, color: BEIGE }}>
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow={content.services.eyebrow} title={content.services.title} invert />
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {content.services.items.map((service) => (
            <article
              key={service.id}
              className="rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-1"
              style={{
                backgroundColor: "rgba(247,241,232,0.05)",
                border: "1px solid rgba(201,169,106,0.22)",
                boxShadow: "0 18px 45px -30px rgba(0,0,0,0.18)",
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.35em]" style={{ color: GOLD }}>
                Servico
              </div>
              <h3 className="mt-5 text-3xl" style={{ ...SERIF, color: BEIGE, fontWeight: 400 }}>
                {service.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(247,241,232,0.76)" }}>
                {service.description}
              </p>
              <div className="mt-8">
                <WhatsappButton href={whatsappLink} label={content.services.ctaLabel} dark />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ content }: { content: SiteContent }) {
  return (
    <section id="cta" className="px-6 py-24 lg:px-10 lg:py-32" style={{ backgroundColor: BROWN }}>
      <div className="mx-auto max-w-5xl text-center">
        <span className="text-[10px] uppercase tracking-[0.45em]" style={{ color: GOLD }}>
          {content.ctaFinal.eyebrow}
        </span>
        <h2
          className="mt-6 text-4xl leading-[1.02] sm:text-5xl md:text-6xl"
          style={{ ...SERIF, color: BEIGE, fontWeight: 300 }}
        >
          {content.ctaFinal.title}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed" style={{ color: "rgba(247,241,232,0.74)" }}>
          {content.ctaFinal.description}
        </p>
        <div className="mt-10">
          <WhatsappButton href={content.ctaFinal.cta.href} label={content.ctaFinal.cta.label} large dark />
        </div>
      </div>
    </section>
  );
}

function Footer({ content }: { content: SiteContent }) {
  return (
    <footer className="px-6 py-10 lg:px-10" style={{ backgroundColor: "#2d2017", color: "rgba(247,241,232,0.74)" }}>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-[10px] uppercase tracking-[0.3em] sm:flex-row">
        <span>{content.brand.name}</span>
        <span style={{ color: GOLD }}>{config.whatsapp}</span>
        <span>Fotografia premium para marcas e historias</span>
      </div>
    </footer>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  invert = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  invert?: boolean;
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <span className="text-[10px] uppercase tracking-[0.45em]" style={{ color: GOLD }}>
        {eyebrow}
      </span>
      <h2
        className="mt-6 text-4xl leading-[1.02] sm:text-5xl md:text-6xl"
        style={{ ...SERIF, color: invert ? BEIGE : BROWN, fontWeight: 300 }}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-6 text-base leading-relaxed" style={{ color: invert ? "rgba(247,241,232,0.74)" : BROWN_SOFT }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

function WhatsappButton({
  href,
  label,
  dark = false,
  large = false,
  light = false,
}: {
  href: string;
  label: string;
  dark?: boolean;
  large?: boolean;
  light?: boolean;
}) {
  const backgroundColor = light ? "rgba(247,241,232,0.12)" : dark ? GOLD : BROWN;
  const color = light ? BEIGE : dark ? BROWN : BEIGE;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center rounded-full uppercase tracking-[0.3em] transition-all duration-500 hover:-translate-y-0.5 ${
        large ? "px-8 py-4 text-xs" : "px-6 py-3 text-[11px]"
      }`}
      style={{
        backgroundColor,
        color,
        border: light ? "1px solid rgba(247,241,232,0.18)" : "none",
        boxShadow: dark
          ? "0 16px 40px -24px rgba(201,169,106,0.6)"
          : "0 16px 40px -24px rgba(59,42,29,0.45)",
      }}
    >
      {label}
    </a>
  );
}
