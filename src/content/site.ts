// Centralized site content. Designed to be swapped for a CMS / Supabase fetch.
// Replace this module with a server-loaded equivalent without touching the UI.
const fallback = "/placeholder.jpg";

export type PortfolioItem = {
  id: string;
  title: string;
  category: string;
  src: string;
  aspect: "portrait" | "landscape";
};

export type Service = {
  id: string;
  title: string;
  description: string;
};

export const site = {
  brand: {
    name: "Emilly Alves",
    monogram: "EA",
    tagline: "Fotografa • Filmmaker • Diretora Criativa",
  },
  nav: [
    { label: "Projetos", href: "#portfolio" },
    { label: "Sobre", href: "#sobre" },
    { label: "Servicos", href: "#servicos" },
    { label: "Contato", href: "#contato" },
  ],
  hero: {
    eyebrow: "Visual Storytelling & Cinematic Direction",
    title: "Emilly Alves",
    subtitle: "Fotografa • Filmmaker • Diretora Criativa",
    description:
      "Historias contadas em imagem e movimento com direcao visual, sensibilidade editorial e estetica cinematografica para marcas e projetos criativos.",
    cta: { label: "Ver disponibilidade", href: "#contato" },
    secondaryCta: { label: "Explorar projetos", href: "#portfolio" },
    image: fallback,
  },
  portfolio: {
    eyebrow: "Selecao",
    title: "Projetos",
    description:
      "Uma curadoria de trabalhos em fotografia, video e direcao criativa para projetos editoriais, campanhas e narrativas visuais.",
    items: [
      { id: "1", title: "Serie Luz", category: "Fotografia", src: fallback, aspect: "portrait" },
      { id: "2", title: "Editorial Ambar", category: "Direcao Criativa", src: fallback, aspect: "portrait" },
      { id: "3", title: "Narrativa", category: "Video", src: fallback, aspect: "landscape" },
      { id: "4", title: "Campos Dourados", category: "Fotografia", src: fallback, aspect: "portrait" },
      { id: "5", title: "Colecao Terra", category: "Direcao Criativa", src: fallback, aspect: "portrait" },
      { id: "6", title: "Eclipse", category: "Video", src: fallback, aspect: "landscape" },
    ] as PortfolioItem[],
  },
  about: {
    eyebrow: "Sobre",
    title: "Imagem, movimento e direcao.",
    paragraphs: [
      "Sou Emilly Alves, fotografa, filmmaker e diretora criativa apaixonada por traduzir emocao em linguagem visual. Ha mais de oito anos crio narrativas que cruzam fotografia, cinema e direcao de arte.",
      "Meu trabalho nasce da escuta para entender a essencia de cada projeto antes de criar. Cada peca e construida com cuidado, do conceito a entrega final, para que o resultado seja autentico, visualmente marcante e atemporal.",
    ],
    stats: [
      { value: "+200", label: "Projetos" },
      { value: "+80", label: "Marcas" },
      { value: "8 anos", label: "De estrada" },
    ],
    image: fallback,
  },
  services: {
    eyebrow: "Servicos",
    title: "Como podemos trabalhar juntos",
    items: [
      {
        id: "fotografia",
        title: "Fotografia",
        description:
          "Ensaios autorais, editoriais, campanhas publicitarias e coberturas com olhar cinematografico e direcao de arte integrada.",
      },
      {
        id: "audiovisual",
        title: "Producao Audiovisual",
        description:
          "Filmes e videos com narrativa cinematografica, roteiro, captacao, direcao e pos-producao para projetos criativos e comerciais.",
      },
      {
        id: "institucionais",
        title: "Filmes Institucionais",
        description:
          "Videos corporativos e institucionais com linguagem visual refinada, da concepcao narrativa a entrega final.",
      },
      {
        id: "marcas",
        title: "Conteudo para Marcas",
        description:
          "Campanhas publicitarias, conteudo para redes sociais e filmes de marca com direcao criativa e identidade visual forte.",
      },
      {
        id: "direcao",
        title: "Direcao Criativa",
        description:
          "Concepcao visual, moodboards, direcao de arte e consultoria criativa para campanhas, producoes e marcas.",
      },
      {
        id: "editorial",
        title: "Editorial & Comercial",
        description:
          "Projetos editoriais e campanhas comerciais que unem storytelling, estetica e estrategia de comunicacao visual.",
      },
    ] as Service[],
  },
  ctaFinal: {
    eyebrow: "Vamos criar juntos",
    title: "Cada historia merece ser contada com arte e direcao.",
    description:
      "Agendas limitadas por mes para garantir dedicacao a cada projeto. Entre em contato para conversarmos sobre a sua ideia.",
    cta: { label: "Iniciar projeto", href: "#contato" },
  },
  contact: {
    eyebrow: "Contato",
    title: "Vamos conversar",
    description:
      "Conte um pouco sobre o seu projeto. Respondo pessoalmente em ate 24 horas.",
    whatsapp: {
      label: "Chamar no WhatsApp",
      number: "+55 11 99999-9999",
      href: "https://wa.me/5511999999999",
    },
    email: "contato@emillyalves.com",
    location: "Sao Paulo, Brasil",
  },
};

export type SiteContent = typeof site;
