import aboutImage from "@/assets/about.jpg";
import heroImage from "@/assets/hero.jpg";
import portfolio1 from "@/assets/p1.jpg";
import portfolio2 from "@/assets/p2.jpg";
import portfolio3 from "@/assets/p3.jpg";
import portfolio4 from "@/assets/p4.jpg";
import portfolio5 from "@/assets/p5.jpg";
import portfolio6 from "@/assets/p6.jpg";

export const config = {
  nome: "Emilly Alves",
  titulo: "Fotografia que transforma momentos em historias inesqueciveis",
  subtitulo: "Ensaios, campanhas e producoes visuais com estetica cinematografica",
  whatsapp: "55NUMERO",
  mensagem: "Ola, vi seu trabalho e quero um orcamento",
};

export const whatsappLink = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(config.mensagem)}`;

export const site = {
  brand: {
    name: config.nome,
    monogram: "EA",
    tagline: "Fotografia, video e direcao criativa com assinatura premium",
  },
  nav: [
    { label: "Inicio", href: "#top" },
    { label: "Portfolio", href: "#portfolio" },
    { label: "Sobre", href: "#sobre" },
    { label: "Servicos", href: "#servicos" },
    { label: "Contato", href: "#cta" },
  ],
  hero: {
    eyebrow: "Emilly Alves",
    title: config.titulo,
    subtitle: config.subtitulo,
    image: heroImage,
    cta: {
      label: "Agendar ensaio",
      href: whatsappLink,
    },
  },
  portfolio: {
    eyebrow: "Portfolio",
    title: "Imagens que fazem sua marca ser lembrada.",
    description:
      "Uma curadoria visual criada para despertar desejo, transmitir autoridade e valorizar cada detalhe do seu projeto.",
    items: [
      { id: "p1", title: "Editorial em luz natural", category: "Fotografia", src: portfolio1 },
      { id: "p2", title: "Campanha com direcao visual", category: "Campanha", src: portfolio2 },
      { id: "p3", title: "Narrativa para marcas", category: "Conteudo", src: portfolio3 },
      { id: "p4", title: "Retratos com identidade", category: "Retrato", src: portfolio4 },
      { id: "p5", title: "Estetica cinematografica", category: "Direcao Criativa", src: portfolio5 },
      { id: "p6", title: "Imagem que vende", category: "Marca", src: portfolio6 },
    ],
  },
  about: {
    eyebrow: "Sobre",
    title: "Mais de 8 anos transformando ideias em imagens que conectam e vendem",
    description:
      "Cada producao nasce com sensibilidade, direcao e intencao comercial para traduzir a essencia da sua marca em imagens fortes, elegantes e memoraveis.",
    image: aboutImage,
    ctaLabel: "Falar com a fotografa",
  },
  services: {
    eyebrow: "Servicos",
    title: "Solucoes visuais pensadas para emocionar, posicionar e converter.",
    items: [
      {
        id: "fotografia",
        title: "Fotografia",
        description: "Ensaios, editoriais e campanhas com direcao sensivel e acabamento premium.",
      },
      {
        id: "video",
        title: "Video",
        description: "Producoes audiovisuais com ritmo, atmosfera e narrativa cinematografica.",
      },
      {
        id: "direcao",
        title: "Direcao Criativa",
        description: "Conceito, linguagem visual e coerencia estetica para elevar a percepcao da sua marca.",
      },
      {
        id: "marcas",
        title: "Conteudo para marcas",
        description: "Imagem e video orientados para campanhas, redes sociais e paginas de conversao.",
      },
    ],
    ctaLabel: "Quero um orcamento",
  },
  ctaFinal: {
    eyebrow: "CTA Final",
    title: "Vamos criar algo unico para sua marca?",
    description:
      "Se voce busca imagens que valorizam sua historia e ajudam sua marca a vender melhor, vamos conversar.",
    cta: {
      label: "Falar com a fotografa",
      href: whatsappLink,
    },
  },
};

export type SiteContent = typeof site;
