import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { getPortfolioProjectById } from "@/lib/api";

export const Route = createFileRoute("/projects/$id")({
  component: ProjectDetailsPage,
});

const SERIF = { fontFamily: "var(--font-serif)" } as const;
const SANS = { fontFamily: "var(--font-sans)" } as const;
const BEIGE = "#f7f1e8";
const BEIGE_DEEP = "#ede3d2";
const BROWN = "#3b2a1d";
const BROWN_SOFT = "#6b5443";
const GOLD = "#c9a96a";
const fallback = "/placeholder.jpg";

function safeImageSrc(src: string | null | undefined) {
  return src && src.trim() ? src : fallback;
}

function ProjectDetailsPage() {
  const { id } = Route.useParams();
  const projectQuery = useQuery({
    queryKey: ["project-details", id],
    queryFn: () => getPortfolioProjectById(id),
  });

  if (projectQuery.isLoading) {
    return <CenteredState title="Carregando projeto" description="Preparando os detalhes desta pagina." />;
  }

  if (projectQuery.isError) {
    return (
      <CenteredState
        title="Projeto indisponivel"
        description={projectQuery.error.message || "Nao foi possivel carregar este projeto agora."}
      />
    );
  }

  const project = projectQuery.data;

  if (!project) {
    return (
      <CenteredState
        title="Projeto nao encontrado"
        description="Esse projeto nao existe, nao esta publicado ou nao pertence ao usuario atual."
      />
    );
  }

  const mainImage = safeImageSrc(project.imageSrc);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BEIGE, color: BROWN, ...SANS }}>
      <header
        className="sticky top-0 z-40 border-b px-6 py-5 backdrop-blur-md lg:px-10"
        style={{
          backgroundColor: "rgba(247,241,232,0.88)",
          borderColor: "rgba(59,42,29,0.12)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.3em] transition-opacity hover:opacity-70"
            style={{ color: BROWN }}
          >
            Voltar
          </Link>
          <a
            href="/#contato"
            className="rounded-full px-5 py-3 text-xs uppercase tracking-[0.25em] transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: BROWN, color: BEIGE }}
          >
            Quero um projeto assim
          </a>
        </div>
      </header>

      <main className="px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            <div className="overflow-hidden rounded-[2rem]" style={{ backgroundColor: BEIGE_DEEP }}>
              <img
                src={mainImage}
                alt={project.title}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-[0.45em]" style={{ color: GOLD }}>
                {project.category}
              </span>
              <h1
                className="mt-5 text-4xl leading-[1.02] sm:text-6xl"
                style={{ ...SERIF, color: BROWN, fontWeight: 300 }}
              >
                {project.title}
              </h1>
              <p className="mt-6 text-base leading-relaxed" style={{ color: BROWN_SOFT }}>
                {project.description}
              </p>
              <a
                href="/#contato"
                className="mt-10 inline-flex w-fit items-center gap-3 rounded-full px-8 py-4 text-xs uppercase tracking-[0.3em] transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: GOLD, color: BROWN }}
              >
                Quero um projeto assim <span>{"\u2192"}</span>
              </a>
            </div>
          </div>

          {project.gallery.length > 0 ? (
            <section className="mt-16 lg:mt-24">
              <div className="max-w-2xl">
                <span className="text-[10px] uppercase tracking-[0.45em]" style={{ color: GOLD }}>
                  Galeria
                </span>
                <h2
                  className="mt-5 text-3xl sm:text-5xl"
                  style={{ ...SERIF, color: BROWN, fontWeight: 300 }}
                >
                  Referencias visuais do projeto
                </h2>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {project.gallery.map((image, index) => (
                  <div
                    key={`${project.id}-${index}`}
                    className="overflow-hidden rounded-[1.75rem]"
                    style={{ backgroundColor: BEIGE_DEEP }}
                  >
                    <img
                      src={safeImageSrc(image)}
                      alt={`${project.title} ${index + 1}`}
                      className="aspect-[4/5] w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function CenteredState({ description, title }: { description: string; title: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 text-center"
      style={{ backgroundColor: BEIGE, color: BROWN, ...SANS }}
    >
      <div className="max-w-xl">
        <p className="text-[10px] uppercase tracking-[0.45em]" style={{ color: GOLD }}>
          Projetos
        </p>
        <h1 className="mt-5 text-4xl sm:text-5xl" style={{ ...SERIF, fontWeight: 300 }}>
          {title}
        </h1>
        <p className="mt-5 text-base leading-relaxed" style={{ color: BROWN_SOFT }}>
          {description}
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full px-6 py-3 text-xs uppercase tracking-[0.25em]"
          style={{ backgroundColor: BROWN, color: BEIGE }}
        >
          Voltar ao site
        </Link>
      </div>
    </div>
  );
}
