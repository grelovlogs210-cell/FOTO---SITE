// Centralized site content. Designed to be swapped for a CMS / Supabase fetch.
// Replace this module with a server-loaded equivalent without touching the UI.
import hero from "@/assets/hero.jpg";
import about from "@/assets/about.jpg";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";

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
    tagline: "Fotógrafa • Filmmaker • Diretora Criativa",
  },
  nav: [
    { label: "Projetos", href: "#portfolio" },
    { label: "Sobre", href: "#sobre" },
    { label: "Serviços", href: "#servicos" },
    { label: "Contato", href: "#contato" },
  ],
  hero: {
    eyebrow: "Visual Storytelling & Cinematic Direction",
    title: "Emilly Alves",
    subtitle: "Fotógrafa • Filmmaker • Diretora Criativa",
    description:
      "Histórias contadas em imagem e movimento — com direção visual, sensibilidade editorial e estética cinematográfica para marcas e projetos criativos.",
    cta: { label: "Ver disponibilidade", href: "#contato" },
    secondaryCta: { label: "Explorar projetos", href: "#portfolio" },
    image: hero,
  },
  portfolio: {
    eyebrow: "Seleção",
    title: "Projetos",
    description:
      "Uma curadoria de trabalhos em fotografia, vídeo e direção criativa — projetos editoriais, campanhas e narrativas visuais com estética cinematográfica.",
    items: [
      { id: "1", title: "Série Luz", category: "Fotografia", src: p1, aspect: "portrait" },
      { id: "2", title: "Editorial Âmbar", category: "Direção Criativa", src: p2, aspect: "portrait" },
      { id: "3", title: "Narrativa", category: "Vídeo", src: p3, aspect: "landscape" },
      { id: "4", title: "Campos Dourados", category: "Fotografia", src: p4, aspect: "portrait" },
      { id: "5", title: "Coleção Terra", category: "Direção Criativa", src: p5, aspect: "portrait" },
      { id: "6", title: "Eclipse", category: "Vídeo", src: p6, aspect: "landscape" },
    ] as PortfolioItem[],
  },
  about: {
    eyebrow: "Sobre",
    title: "Imagem, movimento e direção.",
    paragraphs: [
      "Sou Emilly Alves, fotógrafa, filmmaker e diretora criativa apaixonada por traduzir emoção em linguagem visual. Há mais de oito anos crio narrativas que cruzam fotografia, cinema e direção de arte.",
      "Meu trabalho nasce da escuta — entender a essência de cada projeto antes de criar. Cada peça é construída com cuidado, do conceito à entrega final, para que o resultado seja autêntico, visualmente marcante e atemporal.",
    ],
    stats: [
      { value: "+200", label: "Projetos" },
      { value: "+80", label: "Marcas" },
      { value: "8 anos", label: "De estrada" },
    ],
    image: about,
  },
  services: {
    eyebrow: "Serviços",
    title: "Como podemos trabalhar juntos",
    items: [
      {
        id: "fotografia",
        title: "Fotografia",
        description:
          "Ensaios autorais, editoriais, campanhas publicitárias e coberturas com olhar cinematográfico e direção de arte integrada.",
      },
      {
        id: "audiovisual",
        title: "Produção Audiovisual",
        description:
          "Filmes e vídeos com narrativa cinematográfica — roteiro, captação, direção e pós-produção para projetos criativos e comerciais.",
      },
      {
        id: "institucionais",
        title: "Filmes Institucionais",
        description:
          "Vídeos corporativos e institucionais com linguagem visual refinada — da concepção narrativa à entrega final.",
      },
      {
        id: "marcas",
        title: "Conteúdo para Marcas",
        description:
          "Campanhas publicitárias, conteúdo para redes sociais e filmes de marca com direção criativa e identidade visual forte.",
      },
      {
        id: "direcao",
        title: "Direção Criativa",
        description:
          "Concepção visual, moodboards, direção de arte e consultoria criativa para campanhas, produções e marcas.",
      },
      {
        id: "editorial",
        title: "Editorial & Comercial",
        description:
          "Projetos editoriais e campanhas comerciais que unem storytelling, estética e estratégia de comunicação visual.",
      },
    ] as Service[],
  },
  ctaFinal: {
    eyebrow: "Vamos criar juntos",
    title: "Cada história merece ser contada com arte e direção.",
    description:
      "Agendas limitadas por mês para garantir dedicação a cada projeto. Entre em contato para conversarmos sobre a sua ideia.",
    cta: { label: "Iniciar projeto", href: "#contato" },
  },
  contact: {
    eyebrow: "Contato",
    title: "Vamos conversar",
    description:
      "Conte um pouco sobre o seu projeto. Respondo pessoalmente em até 24 horas.",
    whatsapp: {
      label: "Chamar no WhatsApp",
      number: "+55 11 99999-9999",
      href: "https://wa.me/5511999999999",
    },
    email: "contato@emillyalves.com",
    location: "São Paulo, Brasil",
  },
};

export type SiteContent = typeof site;
