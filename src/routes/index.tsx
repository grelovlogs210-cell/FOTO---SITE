import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { site, type PortfolioItem, type Service, type SiteContent } from "@/content/site";
import { getSiteContent } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Emilly Alves - Fotografia, Filme & Dire\u00E7\u00E3o Criativa" },
      {
        name: "description",
        content:
          "Emilly Alves: fot\u00F3grafa, filmmaker e diretora criativa. Visual storytelling, dire\u00E7\u00E3o visual e produ\u00E7\u00E3o audiovisual com est\u00E9tica cinematogr\u00E1fica.",
      },
      { property: "og:title", content: "Emilly Alves - Fotografia, Filme & Dire\u00E7\u00E3o Criativa" },
      {
        property: "og:description",
        content:
          "Cinematic storytelling e dire\u00E7\u00E3o visual. Fotografia, filmes para marcas, conte\u00FAdo editorial e dire\u00E7\u00E3o criativa.",
      },
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

function Index() {
  const { data } = useQuery({
    queryKey: ["site-content"],
    queryFn: getSiteContent,
    initialData: site,
  });

  const content = data ?? site;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BEIGE, color: BROWN, ...SANS }}>
      <Nav content={content} />
      <Hero content={content} />
      <Portfolio content={content} />
      <About content={content} />
      <Services content={content} />
      <CtaFinal content={content} />
      <Contact content={content} />
      <Footer content={content} />
    </div>
  );
}

function Nav({ content }: { content: SiteContent }) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{ backgroundColor: "rgba(59,42,29,0.78)", borderBottom: "1px solid rgba(201,169,106,0.22)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <a
          href="#top"
          className="flex items-center rounded-xl px-3 py-1.5"
          style={{
            backgroundColor: "rgba(247,241,232,0.1)",
            backdropFilter: "blur(4px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          }}
        >
          <img
            src={logo}
            alt={content.brand.name}
            className="h-11 w-auto sm:h-12"
            style={{ maxHeight: 48, filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.28))" }}
          />
        </a>
        <nav className="hidden items-center gap-10 md:flex">
          {content.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-xs tracking-[0.25em] uppercase transition-colors hover:opacity-100"
              style={{ color: "rgba(247,241,232,0.82)" }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href={content.contact.whatsapp.href}
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-full px-5 py-2.5 text-xs tracking-[0.25em] uppercase transition-all hover:-translate-y-0.5 md:inline-block"
          style={{ backgroundColor: BROWN, color: BEIGE }}
        >
          Contato
        </a>
      </div>
    </header>
  );
}

function Hero({ content }: { content: SiteContent }) {
  return (
    <section id="top" className="relative min-h-screen w-full overflow-hidden">
      <img
        src={content.hero.image}
        alt=""
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(59,42,29,0.55) 0%, rgba(59,42,29,0.35) 45%, rgba(59,42,29,0.75) 100%)",
        }}
      />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        <span className="mb-8 text-[10px] tracking-[0.5em] uppercase" style={{ color: GOLD }}>
          {content.hero.eyebrow}
        </span>
        <h1
          className="text-5xl leading-[0.95] sm:text-7xl md:text-8xl lg:text-9xl"
          style={{ ...SERIF, color: BEIGE, fontWeight: 300, letterSpacing: "-0.02em" }}
        >
          {content.hero.title}
        </h1>
        <div className="my-8 flex items-center gap-4">
          <span className="h-px w-12" style={{ backgroundColor: GOLD }} />
          <span className="text-xs tracking-[0.35em] uppercase" style={{ color: BEIGE }}>
            {content.hero.subtitle}
          </span>
          <span className="h-px w-12" style={{ backgroundColor: GOLD }} />
        </div>
        <p
          className="mx-auto max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: "rgba(247,241,232,0.85)" }}
        >
          {content.hero.description}
        </p>
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <a
            href={content.hero.cta.href}
            className="group inline-flex items-center gap-3 rounded-full px-9 py-4 text-xs tracking-[0.3em] uppercase shadow-[0_20px_50px_-15px_rgba(201,169,106,0.6)] transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: GOLD, color: BROWN }}
          >
            {content.hero.cta.label}
            <span className="transition-transform group-hover:translate-x-1">{"\u2192"}</span>
          </a>
          <a
            href={content.hero.secondaryCta.href}
            className="text-xs tracking-[0.3em] uppercase underline-offset-8 hover:underline"
            style={{ color: BEIGE }}
          >
            {content.hero.secondaryCta.label}
          </a>
        </div>
      </div>
      <div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[10px] tracking-[0.4em] uppercase"
        style={{ color: "rgba(247,241,232,0.7)" }}
      >
        Scroll
      </div>
    </section>
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
  const color = invert ? BEIGE : BROWN;
  const soft = invert ? "rgba(247,241,232,0.75)" : BROWN_SOFT;

  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: GOLD }}>
        {eyebrow}
      </span>
      <h2
        className="mt-6 text-4xl leading-[1.05] sm:text-5xl md:text-6xl"
        style={{ ...SERIF, color, fontWeight: 300, letterSpacing: "-0.01em" }}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-6 text-base leading-relaxed" style={{ color: soft }}>
          {description}
        </p>
      )}
    </div>
  );
}

function Portfolio({ content }: { content: SiteContent }) {
  const items = content.portfolio.items;

  return (
    <section id="portfolio" className="px-6 py-24 sm:py-32 lg:px-10 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={content.portfolio.eyebrow}
          title={content.portfolio.title}
          description={content.portfolio.description}
        />
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:mt-20 lg:grid-cols-3">
          {items.map((item, i) => (
            <PortfolioCard
              key={item.id}
              item={item}
              className={i === 0 || i === 4 ? "lg:row-span-2" : ""}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PortfolioCard({ item, className = "" }: { item: PortfolioItem; className?: string }) {
  const isTall = className.includes("row-span-2");

  return (
    <a
      href="#contato"
      className={`group relative block overflow-hidden rounded-[2rem] ${className}`}
      style={{ backgroundColor: BEIGE_DEEP }}
    >
      <div
        className={`relative w-full overflow-hidden ${
          isTall
            ? "aspect-[3/4] lg:aspect-auto lg:h-full"
            : item.aspect === "landscape"
              ? "aspect-[4/3]"
              : "aspect-[3/4]"
        }`}
      >
        <img
          src={item.src}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
        />
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(180deg, rgba(59,42,29,0) 35%, rgba(59,42,29,0.85) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 translate-y-3 p-7 opacity-0 transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-[10px] tracking-[0.4em] uppercase" style={{ color: GOLD }}>
            {item.category}
          </span>
          <h3 className="mt-2 text-2xl" style={{ ...SERIF, color: BEIGE, fontWeight: 400 }}>
            {item.title}
          </h3>
        </div>
      </div>
    </a>
  );
}

function About({ content }: { content: SiteContent }) {
  return (
    <section
      id="sobre"
      className="px-6 py-24 sm:py-32 lg:px-10 lg:py-40"
      style={{ backgroundColor: BEIGE_DEEP }}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative">
          <div className="overflow-hidden rounded-[2rem]">
            <img
              src={content.about.image}
              alt={content.brand.name}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
          <div
            className="absolute -bottom-6 -right-6 hidden h-32 w-32 rounded-full sm:block"
            style={{ border: `1px solid ${GOLD}` }}
          />
        </div>
        <div>
          <SectionHeader eyebrow={content.about.eyebrow} title={content.about.title} align="left" />
          <div className="mt-8 space-y-5">
            {content.about.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-base leading-relaxed" style={{ color: BROWN_SOFT }}>
                {paragraph}
              </p>
            ))}
          </div>
          <div
            className="mt-10 grid grid-cols-3 gap-6 border-t pt-8"
            style={{ borderColor: "rgba(59,42,29,0.15)" }}
          >
            {content.about.stats.map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-3xl sm:text-4xl"
                  style={{ ...SERIF, color: BROWN, fontWeight: 400 }}
                >
                  {stat.value}
                </div>
                <div
                  className="mt-2 text-[10px] tracking-[0.3em] uppercase"
                  style={{ color: BROWN_SOFT }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Services({ content }: { content: SiteContent }) {
  return (
    <section
      id="servicos"
      className="px-6 py-24 sm:py-32 lg:px-10 lg:py-40"
      style={{ backgroundColor: BROWN, color: BEIGE }}
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={content.services.eyebrow}
          title={content.services.title}
          invert
        />
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-20 lg:gap-8">
          {content.services.items.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <div
      className="group rounded-[2rem] p-10 transition-all duration-500 hover:-translate-y-1"
      style={{
        backgroundColor: "rgba(247,241,232,0.04)",
        border: "1px solid rgba(201,169,106,0.25)",
      }}
    >
      <div
        className="grid h-12 w-12 place-items-center rounded-full text-lg transition-colors"
        style={{ border: `1px solid ${GOLD}`, color: GOLD }}
      >
        {"\u2726"}
      </div>
      <h3 className="mt-8 text-3xl" style={{ ...SERIF, color: BEIGE, fontWeight: 400 }}>
        {service.title}
      </h3>
      <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(247,241,232,0.75)" }}>
        {service.description}
      </p>
      <div
        className="mt-10 inline-flex items-center gap-3 text-[10px] tracking-[0.35em] uppercase transition-all group-hover:gap-5"
        style={{ color: GOLD }}
      >
        Saiba mais <span>{"\u2192"}</span>
      </div>
    </div>
  );
}

function CtaFinal({ content }: { content: SiteContent }) {
  return (
    <section className="px-6 py-24 sm:py-32 lg:px-10 lg:py-40">
      <div className="mx-auto max-w-4xl text-center">
        <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: GOLD }}>
          {content.ctaFinal.eyebrow}
        </span>
        <h2
          className="mt-6 text-4xl leading-[1.05] sm:text-6xl md:text-7xl"
          style={{ ...SERIF, color: BROWN, fontWeight: 300, letterSpacing: "-0.01em" }}
        >
          {content.ctaFinal.title}
        </h2>
        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed" style={{ color: BROWN_SOFT }}>
          {content.ctaFinal.description}
        </p>
        <a
          href={content.ctaFinal.cta.href}
          className="mt-12 inline-flex items-center gap-3 rounded-full px-10 py-4 text-xs tracking-[0.3em] uppercase shadow-[0_20px_50px_-15px_rgba(59,42,29,0.4)] transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: BROWN, color: BEIGE }}
        >
          {content.ctaFinal.cta.label} <span>{"\u2192"}</span>
        </a>
      </div>
    </section>
  );
}

function Contact({ content }: { content: SiteContent }) {
  return (
    <section
      id="contato"
      className="px-6 py-24 sm:py-32 lg:px-10 lg:py-40"
      style={{ backgroundColor: BEIGE_DEEP }}
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeader
            eyebrow={content.contact.eyebrow}
            title={content.contact.title}
            description={content.contact.description}
            align="left"
          />
        </div>
        <div className="space-y-8">
          <a
            href={content.contact.whatsapp.href}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between rounded-[2rem] p-8 transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: BROWN, color: BEIGE }}
          >
            <div>
              <div className="text-[10px] tracking-[0.35em] uppercase" style={{ color: GOLD }}>
                WhatsApp
              </div>
              <div className="mt-2 text-2xl" style={{ ...SERIF }}>
                {content.contact.whatsapp.number}
              </div>
            </div>
            <span
              className="grid h-12 w-12 place-items-center rounded-full text-lg transition-transform group-hover:rotate-45"
              style={{ backgroundColor: GOLD, color: BROWN }}
            >
              {"\u2192"}
            </span>
          </a>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[2rem] p-8" style={{ backgroundColor: BEIGE }}>
              <div className="text-[10px] tracking-[0.35em] uppercase" style={{ color: BROWN_SOFT }}>
                E-mail
              </div>
              <div className="mt-3 text-sm break-all" style={{ color: BROWN }}>
                {content.contact.email}
              </div>
            </div>
            <div className="rounded-[2rem] p-8" style={{ backgroundColor: BEIGE }}>
              <div className="text-[10px] tracking-[0.35em] uppercase" style={{ color: BROWN_SOFT }}>
                Atelier
              </div>
              <div className="mt-3 text-sm" style={{ color: BROWN }}>
                {content.contact.location}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ content }: { content: SiteContent }) {
  return (
    <footer
      className="px-6 py-10 lg:px-10"
      style={{ backgroundColor: BROWN, color: "rgba(247,241,232,0.7)" }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-[10px] tracking-[0.3em] uppercase sm:flex-row">
        <span>&copy; {new Date().getFullYear()} {content.brand.name}</span>
        <span style={{ color: GOLD, ...SERIF, fontSize: "14px", letterSpacing: "0.25em" }}>
          {content.brand.monogram}
        </span>
        <span>Feito com vis\u00E3o</span>
      </div>
    </footer>
  );
}
