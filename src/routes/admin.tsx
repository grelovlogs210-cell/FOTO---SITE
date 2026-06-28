import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  createPortfolio,
  createService,
  deletePortfolio,
  deleteService,
  getAbout,
  getAdminPortfolio,
  getAdminServices,
  getAssetPreviewUrl,
  getSiteSettings,
  listUserAssets,
  reorderPortfolio,
  reorderServices,
  type AboutRow,
  type MediaAsset,
  type PortfolioRow,
  type ServiceRow,
  type SiteSettingsRow,
  uploadUserAsset,
  updatePortfolio,
  updateService,
  upsertAbout,
  upsertSiteSettings,
} from "@/lib/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type AdminContent = {
  about: AboutRow | null;
  media: MediaAsset[];
  portfolio: PortfolioRow[];
  services: ServiceRow[];
  siteSettings: SiteSettingsRow | null;
};

type Notice = {
  kind: "error" | "success";
  message: string;
} | null;

type AdminTab = "dashboard" | "hero" | "about" | "services" | "projects" | "media" | "settings";

const ADMIN_QUERY_KEY = ["admin-content"];
const AUTHORIZED_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? "SEU_EMAIL@gmail.com").toLowerCase();
const IMAGE_FALLBACK = "/placeholder.jpg";

const ADMIN_TABS: Array<{ id: AdminTab; label: string; eyebrow: string }> = [
  { id: "dashboard", label: "Dashboard", eyebrow: "Resumo" },
  { id: "hero", label: "Hero (Home)", eyebrow: "Home" },
  { id: "about", label: "Sobre", eyebrow: "Institucional" },
  { id: "services", label: "Servicos", eyebrow: "Ofertas" },
  { id: "projects", label: "Projetos", eyebrow: "Portfolio" },
  { id: "media", label: "Midia", eyebrow: "Uploads" },
  { id: "settings", label: "Configuracoes", eyebrow: "Site" },
];

const pageTransition = {
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 18 },
  initial: { opacity: 0, y: 18 },
  transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const },
};

const staggerContainer = {
  animate: {
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.06,
    },
  },
};

const fadeUpItem = {
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 16 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
};

const emptySiteSettingsForm = {
  site_name: "",
  site_tagline: "",
  general_info: "",
  hero_title: "",
  hero_subtitle: "",
  hero_description: "",
  hero_image: "",
};

const emptyAboutForm = {
  content: "",
  image_url: "",
};

function isNewService(id: string) {
  return id.startsWith("new-service-");
}

function isNewProject(id: string) {
  return id.startsWith("new-project-");
}

function withSequentialPositions<T extends { position: number }>(items: T[]) {
  return items.map((item, index) => ({ ...item, position: index }));
}

function createEmptyService(position: number): ServiceRow {
  return {
    id: `new-service-${crypto.randomUUID()}`,
    user_id: "",
    position,
    title: "",
    description: "",
  };
}

function createEmptyProject(position: number): PortfolioRow {
  return {
    id: `new-project-${crypto.randomUUID()}`,
    user_id: "",
    position,
    title: "",
    category: "",
    detailed_description: "",
    gallery: [],
    image_url: "",
    is_published: true,
  };
}

function AdminPage() {
  const [authState, setAuthState] = useState<
    "checking" | "signed_out" | "unauthorized" | "authorized" | "unconfigured"
  >("checking");
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [siteSettingsForm, setSiteSettingsForm] = useState(emptySiteSettingsForm);
  const [aboutForm, setAboutForm] = useState(emptyAboutForm);
  const [serviceDrafts, setServiceDrafts] = useState<ServiceRow[]>([]);
  const [projectDrafts, setProjectDrafts] = useState<PortfolioRow[]>([]);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [aboutPreview, setAboutPreview] = useState<string | null>(null);
  const [projectPreviews, setProjectPreviews] = useState<Record<string, string>>({});
  const [busyServiceId, setBusyServiceId] = useState<string | null>(null);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const adminQuery = useQuery<AdminContent>({
    queryKey: ADMIN_QUERY_KEY,
    enabled: authState === "authorized",
    queryFn: async () => {
      const [siteSettings, about, services, portfolio, media] = await Promise.all([
        getSiteSettings(),
        getAbout(),
        getAdminServices(),
        getAdminPortfolio(),
        listUserAssets(),
      ]);

      return {
        about,
        media,
        portfolio,
        services,
        siteSettings,
      };
    },
  });

  const applyUserAccess = (email: string | null) => {
    setUserEmail(email);

    if (!email) {
      setAuthState("signed_out");
      return;
    }

    setAuthState(email === AUTHORIZED_ADMIN_EMAIL ? "authorized" : "unauthorized");
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthState("unconfigured");
      return;
    }

    let isMounted = true;

    const syncSession = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError || !sessionData.session) {
        applyUserAccess(null);
        return;
      }

      const email = sessionData.session.user.email?.toLowerCase() ?? null;
      applyUserAccess(email);
    };

    void syncSession();

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      const email = session?.user.email?.toLowerCase() ?? null;
      applyUserAccess(email);
    });

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const siteSettings = adminQuery.data?.siteSettings;
    const about = adminQuery.data?.about;

    setSiteSettingsForm({
      site_name: siteSettings?.site_name ?? "",
      site_tagline: siteSettings?.site_tagline ?? "",
      general_info: siteSettings?.general_info ?? "",
      hero_title: siteSettings?.hero_title ?? "",
      hero_subtitle: siteSettings?.hero_subtitle ?? "",
      hero_description: siteSettings?.hero_description ?? "",
      hero_image: siteSettings?.hero_image ?? "",
    });

    setAboutForm({
      content: about?.content ?? "",
      image_url: about?.image_url ?? "",
    });

    setServiceDrafts(withSequentialPositions(adminQuery.data?.services ?? []));
    setProjectDrafts(
      withSequentialPositions(
        (adminQuery.data?.portfolio ?? []).map((item) => ({
          ...item,
          gallery: Array.isArray(item.gallery) ? item.gallery : [],
        })),
      ),
    );
  }, [adminQuery.data]);

  const counts = useMemo(
    () => ({
      services: serviceDrafts.length,
      projects: projectDrafts.length,
      publishedProjects: projectDrafts.filter((item) => item.is_published).length,
      media: adminQuery.data?.media.length ?? 0,
    }),
    [adminQuery.data?.media.length, projectDrafts, serviceDrafts.length],
  );

  const refreshQueries = async ({
    refreshAdmin = false,
    refreshSiteContent = true,
  }: {
    refreshAdmin?: boolean;
    refreshSiteContent?: boolean;
  } = {}) => {
    const tasks: Promise<unknown>[] = [];

    if (refreshAdmin) {
      tasks.push(queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEY }));
    }

    if (refreshSiteContent) {
      tasks.push(queryClient.invalidateQueries({ queryKey: ["site-content"] }));
    }

    await Promise.all(tasks);
  };

  const handleSuccess = async (
    message: string,
    options?: { refreshAdmin?: boolean; refreshSiteContent?: boolean },
  ) => {
    setNotice({ kind: "success", message });
    await refreshQueries(options);
  };

  const handleError = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback;
    setNotice({ kind: "error", message });
  };

  const siteSettingsMutation = useMutation({
    mutationFn: () => upsertSiteSettings(siteSettingsForm, adminQuery.data?.siteSettings?.id),
    onSuccess: async () => {
      await handleSuccess("Dados da home salvos com sucesso.");
    },
    onError: (error) => {
      handleError(error, "Nao foi possivel salvar o conteudo da home.");
    },
  });

  const aboutMutation = useMutation({
    mutationFn: () => upsertAbout(aboutForm, adminQuery.data?.about?.id),
    onSuccess: async () => {
      await handleSuccess("Secao sobre salva com sucesso.");
    },
    onError: (error) => {
      handleError(error, "Nao foi possivel salvar a secao sobre.");
    },
  });

  const settingsMutation = useMutation({
    mutationFn: () => upsertSiteSettings(siteSettingsForm, adminQuery.data?.siteSettings?.id),
    onSuccess: async () => {
      await handleSuccess("Configuracoes gerais salvas com sucesso.");
    },
    onError: (error) => {
      handleError(error, "Nao foi possivel salvar as configuracoes.");
    },
  });

  const handleImageUpload = async (
    file: File | null,
    onComplete: (payload: { publicUrl: string; previewUrl: string }) => void,
    persistUpload?: (publicUrl: string) => Promise<void>,
    successMessage = "Imagem enviada com sucesso.",
  ) => {
    if (!file) {
      return;
    }

    try {
      const upload = await uploadUserAsset(file);
      onComplete(upload);

      if (persistUpload) {
        await persistUpload(upload.publicUrl);
      }

      setNotice({ kind: "success", message: successMessage });
    } catch (error) {
      handleError(error, "Nao foi possivel enviar a imagem.");
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setNotice({ kind: "error", message: "Supabase nao esta configurado neste ambiente." });
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin`,
      },
    });

    if (error) {
      handleError(error, "Nao foi possivel iniciar o login com Google.");
    }
  };

  const handleLogout = async () => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      handleError(error, "Nao foi possivel sair da conta.");
      return;
    }

    setNotice({ kind: "success", message: "Logout realizado com sucesso." });
    setUserEmail(null);
    setAuthState("signed_out");
    await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEY });
  };

  const handleMediaUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    setMediaUploading(true);

    try {
      await uploadUserAsset(file);
      await handleSuccess("Arquivo enviado para a biblioteca de midia.", { refreshAdmin: true });
    } catch (error) {
      handleError(error, "Nao foi possivel enviar o arquivo para a biblioteca.");
    } finally {
      setMediaUploading(false);
    }
  };

  const updateServiceDraft = (id: string, patch: Partial<ServiceRow>) => {
    setServiceDrafts((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const updateProjectDraft = (id: string, patch: Partial<PortfolioRow>) => {
    setProjectDrafts((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              gallery: Array.isArray(patch.gallery) ? patch.gallery : item.gallery,
            }
          : item,
      ),
    );
  };

  const removeServiceDraft = (id: string) => {
    setServiceDrafts((current) => current.filter((item) => item.id !== id));
  };

  const removeProjectDraft = (id: string) => {
    setProjectDrafts((current) => current.filter((item) => item.id !== id));
    setProjectPreviews((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const persistServiceOrder = async (items: ServiceRow[]) => {
    const persisted = items
      .filter((item) => !isNewService(item.id))
      .map((item) => ({ id: item.id, position: item.position }));

    if (persisted.length === 0) {
      return;
    }

    await reorderServices(persisted);
  };

  const persistProjectOrder = async (items: PortfolioRow[]) => {
    const persisted = items
      .filter((item) => !isNewProject(item.id))
      .map((item) => ({ id: item.id, position: item.position }));

    if (persisted.length === 0) {
      return;
    }

    await reorderPortfolio(persisted);
  };

  const saveService = async (item: ServiceRow) => {
    setBusyServiceId(item.id);

    try {
      if (isNewService(item.id)) {
        await createService({
          position: item.position,
          title: item.title,
          description: item.description,
        });
        await handleSuccess("Servico criado com sucesso.", { refreshAdmin: true });
        return;
      }

      await updateService(item.id, {
        position: item.position,
        title: item.title,
        description: item.description,
      });
      await handleSuccess("Servico atualizado com sucesso.");
    } catch (error) {
      handleError(error, "Nao foi possivel salvar este servico.");
    } finally {
      setBusyServiceId(null);
    }
  };

  const removeService = async (item: ServiceRow) => {
    if (isNewService(item.id)) {
      removeServiceDraft(item.id);
      return;
    }

    setBusyServiceId(item.id);

    try {
      await deleteService(item.id);
      await handleSuccess("Servico excluido com sucesso.", { refreshAdmin: true });
    } catch (error) {
      handleError(error, "Nao foi possivel excluir este servico.");
    } finally {
      setBusyServiceId(null);
    }
  };

  const saveProject = async (item: PortfolioRow) => {
    setBusyProjectId(item.id);

    try {
      if (isNewProject(item.id)) {
        await createPortfolio({
          position: item.position,
          title: item.title,
          category: item.category,
          detailed_description: item.detailed_description,
          gallery: item.gallery,
          image_url: item.image_url,
          is_published: item.is_published,
        });
        await handleSuccess("Projeto criado com sucesso.", { refreshAdmin: true });
        return;
      }

      await updatePortfolio(item.id, {
        position: item.position,
        title: item.title,
        category: item.category,
        detailed_description: item.detailed_description,
        gallery: item.gallery,
        image_url: item.image_url,
        is_published: item.is_published,
      });
      await handleSuccess("Projeto atualizado com sucesso.");
    } catch (error) {
      handleError(error, "Nao foi possivel salvar este projeto.");
    } finally {
      setBusyProjectId(null);
    }
  };

  const removeProject = async (item: PortfolioRow) => {
    if (isNewProject(item.id)) {
      removeProjectDraft(item.id);
      return;
    }

    setBusyProjectId(item.id);

    try {
      await deletePortfolio(item.id);
      await handleSuccess("Projeto excluido com sucesso.", { refreshAdmin: true });
    } catch (error) {
      handleError(error, "Nao foi possivel excluir este projeto.");
    } finally {
      setBusyProjectId(null);
    }
  };

  const handleServiceDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = serviceDrafts.findIndex((item) => item.id === active.id);
    const newIndex = serviceDrafts.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const next = withSequentialPositions(arrayMove(serviceDrafts, oldIndex, newIndex));
    setServiceDrafts(next);

    try {
      await persistServiceOrder(next);
      setNotice({ kind: "success", message: "Ordem dos servicos atualizada." });
      await refreshQueries({ refreshSiteContent: true });
    } catch (error) {
      handleError(error, "Nao foi possivel salvar a nova ordem dos servicos.");
      await adminQuery.refetch();
    }
  };

  const handleProjectDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = projectDrafts.findIndex((item) => item.id === active.id);
    const newIndex = projectDrafts.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const next = withSequentialPositions(arrayMove(projectDrafts, oldIndex, newIndex));
    setProjectDrafts(next);

    try {
      await persistProjectOrder(next);
      setNotice({ kind: "success", message: "Ordem dos projetos atualizada." });
      await refreshQueries({ refreshSiteContent: true });
    } catch (error) {
      handleError(error, "Nao foi possivel salvar a nova ordem dos projetos.");
      await adminQuery.refetch();
    }
  };

  const handleGalleryDragEnd = async (projectId: string, event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const project = projectDrafts.find((item) => item.id === projectId);

    if (!project) {
      return;
    }

    const oldIndex = project.gallery.findIndex((_, index) => `${projectId}-gallery-${index}` === active.id);
    const newIndex = project.gallery.findIndex((_, index) => `${projectId}-gallery-${index}` === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextGallery = arrayMove(project.gallery, oldIndex, newIndex);
    updateProjectDraft(projectId, { gallery: nextGallery });

    if (isNewProject(projectId)) {
      setNotice({ kind: "success", message: "Ordem local da galeria atualizada." });
      return;
    }

    try {
      await updatePortfolio(projectId, { gallery: nextGallery });
      setNotice({ kind: "success", message: "Ordem da galeria atualizada." });
      await refreshQueries({ refreshSiteContent: true });
    } catch (error) {
      handleError(error, "Nao foi possivel salvar a ordem da galeria.");
      await adminQuery.refetch();
    }
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice({ kind: "success", message: "URL copiada para a area de transferencia." });
    } catch (error) {
      handleError(error, "Nao foi possivel copiar a URL.");
    }
  };

  if (authState === "checking") {
    return <AdminLoadingState label="Verificando acesso" />;
  }

  if (authState === "unconfigured") {
    return (
      <AdminAuthStateCard
        eyebrow="Configuracao"
        title="Supabase nao configurado"
        description="Defina a URL e a anon key do Supabase para habilitar o login do painel."
      />
    );
  }

  if (authState === "signed_out") {
    return (
      <AdminAuthStateCard
        eyebrow="Login"
        title="Entrar no painel"
        description="Use sua conta Google autorizada para acessar o painel administrativo."
        actionLabel="Entrar com Google"
        onAction={() => void handleGoogleLogin()}
      />
    );
  }

  if (authState === "unauthorized") {
    return (
      <AdminAuthStateCard
        eyebrow="Acesso negado"
        title="Conta sem permissao"
        description={`A conta ${userEmail ?? "atual"} nao esta autorizada para este painel.`}
        secondaryDescription={`Permita somente ${AUTHORIZED_ADMIN_EMAIL} ou ajuste VITE_ADMIN_EMAIL.`}
        actionLabel="Sair"
        onAction={() => void handleLogout()}
      />
    );
  }

  if (adminQuery.isLoading) {
    return <AdminLoadingState label="Carregando painel" />;
  }

  if (adminQuery.isError) {
    return <AdminErrorState message={adminQuery.error.message} onRetry={() => void adminQuery.refetch()} />;
  }

  return (
    <div className="min-h-screen bg-[#f5efe6] text-[#3f2d20]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[300px] lg:flex-none">
          <div className="flex h-full flex-col rounded-[2rem] border border-[#e6d8c9] bg-[#fcfaf7] p-6 shadow-[0_24px_80px_rgba(63,45,32,0.08)]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.45em] text-[#9f7b59]">Admin SaaS</p>
              <h1 className="mt-4 text-3xl font-semibold text-[#2f2118]">Painel do site</h1>
              <p className="mt-3 text-sm leading-relaxed text-[#7a6250]">
                Organize conteudo, midias e projetos em um unico workspace.
              </p>
            </div>

            <motion.nav
              className="mt-8 space-y-2"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {ADMIN_TABS.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <motion.button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    variants={fadeUpItem}
                    whileHover={{ scale: 1.015, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full rounded-[1.4rem] px-4 py-4 text-left transition ${
                      isActive
                        ? "bg-[#3f2d20] text-[#fffaf5] shadow-[0_16px_32px_rgba(63,45,32,0.18)]"
                        : "bg-transparent text-[#5f4939] hover:bg-[#f1e7db]"
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-[0.35em] opacity-70">{tab.eyebrow}</div>
                    <div className="mt-2 text-sm font-medium">{tab.label}</div>
                  </motion.button>
                );
              })}
            </motion.nav>

            <div className="mt-auto rounded-[1.6rem] border border-[#eadfd2] bg-[#f6efe7] p-4">
              <div className="text-[10px] uppercase tracking-[0.35em] text-[#8a6b52]">Conta ativa</div>
              <div className="mt-2 break-all text-sm font-medium text-[#3f2d20]">{userEmail}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void adminQuery.refetch()}
                  className="rounded-full border border-[#d8c3ae] px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-[#5a4434] transition hover:bg-[#efe3d5]"
                >
                  Atualizar
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-full border border-[#d8c3ae] px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-[#5a4434] transition hover:bg-[#efe3d5]"
                >
                  Sair
                </button>
                <Link
                  to="/"
                  className="rounded-full bg-[#3f2d20] px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-[#fffaf5] transition hover:bg-[#2f2118]"
                >
                  Ver site
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="rounded-[2rem] border border-[#e6d8c9] bg-[#fcfaf7] p-6 shadow-[0_24px_80px_rgba(63,45,32,0.08)] lg:p-8">
            <div className="flex flex-col gap-4 border-b border-[#efe3d6] pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.45em] text-[#9f7b59]">
                  {ADMIN_TABS.find((tab) => tab.id === activeTab)?.eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-[#2f2118]">
                  {ADMIN_TABS.find((tab) => tab.id === activeTab)?.label}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#7a6250]">
                  {getTabDescription(activeTab)}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge label={`${counts.projects} projetos`} />
                <Badge label={`${counts.services} servicos`} />
                <Badge label={`${counts.media} arquivos`} />
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {notice ? <NoticeBanner key={`${notice.kind}-${notice.message}`} notice={notice} /> : null}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <PageTransition key={activeTab}>
                {activeTab === "dashboard" ? (
                  <DashboardTab about={aboutForm} counts={counts} siteSettings={siteSettingsForm} />
                ) : null}

                {activeTab === "hero" ? (
                  <div className="mt-8 space-y-8">
                    <PanelCard
                      title="Conteudo principal"
                      description="Edite a primeira impressao da home com titulo, subtitulo, descricao e imagem principal."
                    >
                      <div className="grid gap-4 lg:grid-cols-2">
                        <Field
                          label="Titulo"
                          value={siteSettingsForm.hero_title}
                          onChange={(value) => setSiteSettingsForm((current) => ({ ...current, hero_title: value }))}
                        />
                        <Field
                          label="Subtitulo"
                          value={siteSettingsForm.hero_subtitle}
                          onChange={(value) => setSiteSettingsForm((current) => ({ ...current, hero_subtitle: value }))}
                        />
                        <div className="lg:col-span-2">
                          <Field
                            label="Imagem principal"
                            value={siteSettingsForm.hero_image}
                            onChange={(value) => setSiteSettingsForm((current) => ({ ...current, hero_image: value }))}
                            placeholder="https://..."
                          />
                          <FileField
                            label="Upload da imagem do hero"
                            onChange={(file) =>
                              void handleImageUpload(
                                file,
                                ({ publicUrl, previewUrl }) => {
                                  setSiteSettingsForm((current) => ({ ...current, hero_image: publicUrl }));
                                  setHeroPreview(previewUrl);
                                },
                                async (publicUrl) => {
                                  const nextForm = { ...siteSettingsForm, hero_image: publicUrl };
                                  setSiteSettingsForm(nextForm);
                                  await upsertSiteSettings(nextForm, adminQuery.data?.siteSettings?.id);
                                  await refreshQueries({ refreshSiteContent: true });
                                },
                                "Imagem do hero enviada e salva com sucesso.",
                              )
                            }
                          />
                          <ImagePreview src={heroPreview || siteSettingsForm.hero_image} alt="Preview do hero" />
                        </div>
                        <div className="lg:col-span-2">
                          <TextAreaField
                            label="Descricao"
                            value={siteSettingsForm.hero_description}
                            onChange={(value) =>
                              setSiteSettingsForm((current) => ({ ...current, hero_description: value }))
                            }
                            rows={6}
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <PrimaryButton
                          label={siteSettingsMutation.isPending ? "Salvando..." : "Salvar hero"}
                          onClick={() => siteSettingsMutation.mutate()}
                          disabled={siteSettingsMutation.isPending}
                        />
                      </div>
                    </PanelCard>
                  </div>
                ) : null}

                {activeTab === "about" ? (
                  <div className="mt-8 space-y-8">
                    <PanelCard
                      title="Secao sobre"
                      description="Ajuste o texto institucional e a imagem que acompanha a apresentacao."
                    >
                      <div className="grid gap-4">
                        <Field
                          label="Imagem"
                          value={aboutForm.image_url}
                          onChange={(value) => setAboutForm((current) => ({ ...current, image_url: value }))}
                          placeholder="https://..."
                        />
                        <FileField
                          label="Upload da imagem sobre"
                          onChange={(file) =>
                            void handleImageUpload(
                              file,
                              ({ publicUrl, previewUrl }) => {
                                setAboutForm((current) => ({ ...current, image_url: publicUrl }));
                                setAboutPreview(previewUrl);
                              },
                              async (publicUrl) => {
                                const nextForm = { ...aboutForm, image_url: publicUrl };
                                setAboutForm(nextForm);
                                await upsertAbout(nextForm, adminQuery.data?.about?.id);
                                await refreshQueries({ refreshSiteContent: true });
                              },
                              "Imagem da secao sobre enviada e salva com sucesso.",
                            )
                          }
                        />
                        <ImagePreview src={aboutPreview || aboutForm.image_url} alt="Preview da secao sobre" />
                        <TextAreaField
                          label="Texto completo"
                          value={aboutForm.content}
                          onChange={(value) => setAboutForm((current) => ({ ...current, content: value }))}
                          rows={10}
                        />
                      </div>

                      <div className="mt-6">
                        <PrimaryButton
                          label={aboutMutation.isPending ? "Salvando..." : "Salvar sobre"}
                          onClick={() => aboutMutation.mutate()}
                          disabled={aboutMutation.isPending}
                        />
                      </div>
                    </PanelCard>
                  </div>
                ) : null}

                {activeTab === "services" ? (
                  <div className="mt-8 space-y-8">
                    <PanelCard
                      title="Catalogo de servicos"
                      description="Crie, edite, remova e reorganize servicos arrastando os cards."
                      action={
                        <SecondaryButton
                          label="Novo servico"
                          onClick={() =>
                            setServiceDrafts((current) =>
                              withSequentialPositions([createEmptyService(current.length), ...current]),
                            )
                          }
                        />
                      }
                    >
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleServiceDragEnd(event)}>
                        <SortableContext items={serviceDrafts.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                          <motion.div className="space-y-4" variants={staggerContainer} initial="initial" animate="animate">
                            {serviceDrafts.length === 0 ? <EmptyState label="Nenhum servico cadastrado ainda." /> : null}

                            {serviceDrafts.map((item) => {
                              const isBusy = busyServiceId === item.id;

                              return (
                                <SortableCard key={item.id} id={item.id}>
                                  <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="lg:col-span-2">
                                      <div className="mb-3 flex items-center justify-between gap-3">
                                        <div className="text-[11px] uppercase tracking-[0.25em] text-[#8f6d52]">
                                          Posicao {item.position + 1}
                                        </div>
                                        <DragHandle />
                                      </div>
                                    </div>
                                    <Field
                                      label="Titulo"
                                      value={item.title}
                                      onChange={(value) => updateServiceDraft(item.id, { title: value })}
                                    />
                                    <div className="lg:col-span-2">
                                      <TextAreaField
                                        label="Descricao"
                                        value={item.description}
                                        onChange={(value) => updateServiceDraft(item.id, { description: value })}
                                        rows={5}
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-5 flex flex-wrap gap-3">
                                    <PrimaryButton
                                      label={isBusy ? "Salvando..." : isNewService(item.id) ? "Criar" : "Salvar"}
                                      onClick={() => void saveService(item)}
                                      disabled={isBusy}
                                    />
                                    <SecondaryButton
                                      label={isNewService(item.id) ? "Descartar" : "Excluir"}
                                      onClick={() => void removeService(item)}
                                      disabled={isBusy}
                                      tone="danger"
                                    />
                                  </div>
                                </SortableCard>
                              );
                            })}
                          </motion.div>
                        </SortableContext>
                      </DndContext>
                    </PanelCard>
                  </div>
                ) : null}

                {activeTab === "projects" ? (
                  <div className="mt-8 space-y-8">
                    <PanelCard
                      title="Portfolio editavel"
                      description="Reordene projetos e galerias arrastando os cards e imagens."
                      action={
                        <SecondaryButton
                          label="Novo projeto"
                          onClick={() =>
                            setProjectDrafts((current) =>
                              withSequentialPositions([createEmptyProject(current.length), ...current]),
                            )
                          }
                        />
                      }
                    >
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleProjectDragEnd(event)}>
                        <SortableContext items={projectDrafts.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                          <motion.div className="space-y-5" variants={staggerContainer} initial="initial" animate="animate">
                            {projectDrafts.length === 0 ? <EmptyState label="Nenhum projeto cadastrado ainda." /> : null}

                            {projectDrafts.map((item) => {
                              const isBusy = busyProjectId === item.id;

                              return (
                                <SortableCard key={item.id} id={item.id}>
                                  <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="lg:col-span-2">
                                      <div className="mb-3 flex items-center justify-between gap-3">
                                        <div className="text-[11px] uppercase tracking-[0.25em] text-[#8f6d52]">
                                          Posicao {item.position + 1}
                                        </div>
                                        <DragHandle />
                                      </div>
                                    </div>
                                    <Field
                                      label="Titulo"
                                      value={item.title}
                                      onChange={(value) => updateProjectDraft(item.id, { title: value })}
                                    />
                                    <Field
                                      label="Categoria"
                                      value={item.category}
                                      onChange={(value) => updateProjectDraft(item.id, { category: value })}
                                    />
                                    <div className="lg:col-span-2">
                                      <Field
                                        label="Imagem principal"
                                        value={item.image_url}
                                        onChange={(value) => updateProjectDraft(item.id, { image_url: value })}
                                        placeholder="https://..."
                                      />
                                      <FileField
                                        label="Upload da capa do projeto"
                                        onChange={(file) =>
                                          void handleImageUpload(
                                            file,
                                            ({ publicUrl, previewUrl }) => {
                                              updateProjectDraft(item.id, { image_url: publicUrl });
                                              setProjectPreviews((current) => ({ ...current, [item.id]: previewUrl }));
                                            },
                                            isNewProject(item.id)
                                              ? undefined
                                              : async (publicUrl) => {
                                                  await updatePortfolio(item.id, { image_url: publicUrl });
                                                  await refreshQueries({ refreshSiteContent: true });
                                                },
                                            isNewProject(item.id)
                                              ? "Imagem enviada. Salve o projeto para persistir no banco."
                                              : "Imagem principal enviada e salva com sucesso.",
                                          )
                                        }
                                      />
                                      <ImagePreview
                                        src={projectPreviews[item.id] || item.image_url}
                                        alt={`Preview do projeto ${item.title || "novo"}`}
                                      />
                                    </div>
                                    <div className="lg:col-span-2">
                                      <TextAreaField
                                        label="Descricao detalhada"
                                        value={item.detailed_description ?? ""}
                                        onChange={(value) => updateProjectDraft(item.id, { detailed_description: value })}
                                        rows={7}
                                      />
                                    </div>
                                    <div className="lg:col-span-2">
                                      <motion.div
                                        whileHover={{ y: -2 }}
                                        className="rounded-[1.4rem] border border-[#e7d8c9] bg-[#fcfaf7] p-4"
                                      >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                          <div>
                                            <div className="text-xs uppercase tracking-[0.3em] text-[#8f6d52]">Galeria</div>
                                            <p className="mt-2 text-sm text-[#7a6250]">
                                              Reorganize as imagens arrastando para definir a ordem da pagina detalhada.
                                            </p>
                                          </div>
                                          <div className="sm:min-w-[260px]">
                                            <FileField
                                              label="Adicionar imagem na galeria"
                                              onChange={(file) =>
                                                void handleImageUpload(
                                                  file,
                                                  ({ publicUrl }) => {
                                                    const nextGallery = [...(item.gallery ?? []), publicUrl];
                                                    updateProjectDraft(item.id, { gallery: nextGallery });
                                                  },
                                                  isNewProject(item.id)
                                                    ? undefined
                                                    : async (publicUrl) => {
                                                        const nextGallery = [...(item.gallery ?? []), publicUrl];
                                                        updateProjectDraft(item.id, { gallery: nextGallery });
                                                        await updatePortfolio(item.id, { gallery: nextGallery });
                                                      },
                                                  isNewProject(item.id)
                                                    ? "Imagem adicionada. Salve o projeto para persistir a galeria."
                                                    : "Imagem adicionada na galeria com sucesso.",
                                                )
                                              }
                                            />
                                          </div>
                                        </div>

                                        <DndContext
                                          sensors={sensors}
                                          collisionDetection={closestCenter}
                                          onDragEnd={(event) => void handleGalleryDragEnd(item.id, event)}
                                        >
                                          <SortableContext
                                            items={item.gallery.map((_, index) => `${item.id}-gallery-${index}`)}
                                            strategy={rectSortingStrategy}
                                          >
                                            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                              {(item.gallery ?? []).map((image, index) => (
                                                <SortableGalleryCard
                                                  key={`${item.id}-gallery-${index}`}
                                                  id={`${item.id}-gallery-${index}`}
                                                  image={image}
                                                  label={`Imagem ${index + 1}`}
                                                  onRemove={async () => {
                                                    const nextGallery = (item.gallery ?? []).filter((_, itemIndex) => itemIndex !== index);
                                                    updateProjectDraft(item.id, { gallery: nextGallery });

                                                    if (!isNewProject(item.id)) {
                                                      try {
                                                        await updatePortfolio(item.id, { gallery: nextGallery });
                                                        setNotice({ kind: "success", message: "Imagem removida da galeria." });
                                                      } catch (error) {
                                                        handleError(error, "Nao foi possivel remover a imagem da galeria.");
                                                      }
                                                    }
                                                  }}
                                                />
                                              ))}

                                              {(item.gallery ?? []).length === 0 ? (
                                                <div className="col-span-full">
                                                  <EmptyState label="Este projeto ainda nao possui imagens na galeria." />
                                                </div>
                                              ) : null}
                                            </div>
                                          </SortableContext>
                                        </DndContext>
                                      </motion.div>
                                    </div>

                                    <ToggleField
                                      label="Publicado"
                                      checked={item.is_published}
                                      onChange={(checked) => updateProjectDraft(item.id, { is_published: checked })}
                                    />
                                  </div>

                                  <div className="mt-5 flex flex-wrap gap-3">
                                    <PrimaryButton
                                      label={isBusy ? "Salvando..." : isNewProject(item.id) ? "Criar" : "Salvar"}
                                      onClick={() => void saveProject(item)}
                                      disabled={isBusy}
                                    />
                                    <SecondaryButton
                                      label={isNewProject(item.id) ? "Descartar" : "Excluir"}
                                      onClick={() => void removeProject(item)}
                                      disabled={isBusy}
                                      tone="danger"
                                    />
                                  </div>
                                </SortableCard>
                              );
                            })}
                          </motion.div>
                        </SortableContext>
                      </DndContext>
                    </PanelCard>
                  </div>
                ) : null}

                {activeTab === "media" ? (
                  <div className="mt-8 space-y-8">
                    <PanelCard
                      title="Biblioteca de midia"
                      description="Envie arquivos para o Storage, visualize previews e copie URLs publicas quando precisar."
                    >
                      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                        <motion.div
                          whileHover={{ y: -3 }}
                          className="rounded-[1.6rem] border border-[#eadfd2] bg-[#f8f2ea] p-5"
                        >
                          <div className="text-xs uppercase tracking-[0.3em] text-[#8f6d52]">Novo upload</div>
                          <p className="mt-3 text-sm leading-relaxed text-[#7a6250]">
                            Os arquivos sao organizados automaticamente dentro da pasta do usuario autenticado.
                          </p>
                          <div className="mt-4">
                            <FileField label="Selecionar imagem" onChange={(file) => void handleMediaUpload(file)} />
                          </div>
                          <div className="mt-4 text-xs text-[#8b7058]">
                            {mediaUploading ? "Enviando arquivo..." : "Pronto para receber novas imagens."}
                          </div>
                        </motion.div>

                        <div className="space-y-4">
                          {adminQuery.data?.media.length ? null : <EmptyState label="Nenhum arquivo enviado ainda." />}

                          <motion.div
                            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                          >
                            {(adminQuery.data?.media ?? []).map((asset) => (
                              <motion.div
                                key={asset.path}
                                variants={fadeUpItem}
                                whileHover={{ y: -4, scale: 1.015 }}
                                className="overflow-hidden rounded-[1.6rem] border border-[#eadfd2] bg-[#f8f2ea]"
                              >
                                <img
                                  src={getAssetPreviewUrl(asset.publicUrl, IMAGE_FALLBACK)}
                                  alt={asset.name}
                                  className="h-44 w-full object-cover"
                                />
                                <div className="space-y-3 p-4">
                                  <div className="truncate text-sm font-medium text-[#3f2d20]">{asset.name}</div>
                                  <div className="text-xs text-[#8b7058]">
                                    {asset.createdAt ? new Date(asset.createdAt).toLocaleString("pt-BR") : "Sem data"}
                                  </div>
                                  <SecondaryButton label="Copiar URL" onClick={() => void copyToClipboard(asset.publicUrl)} />
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        </div>
                      </div>
                    </PanelCard>
                  </div>
                ) : null}

                {activeTab === "settings" ? (
                  <div className="mt-8 space-y-8">
                    <PanelCard
                      title="Configuracoes gerais"
                      description="Defina o nome do site, assinatura e informacoes institucionais usadas em diferentes areas do frontend."
                    >
                      <div className="grid gap-4 lg:grid-cols-2">
                        <Field
                          label="Nome do site"
                          value={siteSettingsForm.site_name}
                          onChange={(value) => setSiteSettingsForm((current) => ({ ...current, site_name: value }))}
                        />
                        <Field
                          label="Tagline"
                          value={siteSettingsForm.site_tagline}
                          onChange={(value) => setSiteSettingsForm((current) => ({ ...current, site_tagline: value }))}
                        />
                        <div className="lg:col-span-2">
                          <TextAreaField
                            label="Informacoes gerais"
                            value={siteSettingsForm.general_info}
                            onChange={(value) => setSiteSettingsForm((current) => ({ ...current, general_info: value }))}
                            rows={6}
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <PrimaryButton
                          label={settingsMutation.isPending ? "Salvando..." : "Salvar configuracoes"}
                          onClick={() => settingsMutation.mutate()}
                          disabled={settingsMutation.isPending}
                        />
                      </div>
                    </PanelCard>
                  </div>
                ) : null}
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardTab({
  about,
  counts,
  siteSettings,
}: {
  about: typeof emptyAboutForm;
  counts: { media: number; projects: number; publishedProjects: number; services: number };
  siteSettings: typeof emptySiteSettingsForm;
}) {
  return (
    <motion.div className="mt-8 space-y-8" variants={staggerContainer} initial="initial" animate="animate">
      <motion.div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" variants={staggerContainer}>
        <StatCard label="Projetos" value={counts.projects} caption="Total cadastrado no portfolio" />
        <StatCard label="Projetos publicados" value={counts.publishedProjects} caption="Itens visiveis ao publico" />
        <StatCard label="Servicos" value={counts.services} caption="Ofertas ativas no site" />
        <StatCard label="Arquivos de midia" value={counts.media} caption="Uploads disponiveis no Storage" />
      </motion.div>

      <motion.div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]" variants={fadeUpItem}>
        <PanelCard
          title="Visao geral do conteudo"
          description="Tenha um resumo rapido do que esta configurado nas principais areas do site."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryRow label="Titulo do hero" value={siteSettings.hero_title || "Ainda nao definido"} />
            <SummaryRow label="Nome do site" value={siteSettings.site_name || "Ainda nao definido"} />
            <SummaryRow label="Subtitulo" value={siteSettings.hero_subtitle || "Ainda nao definido"} />
            <SummaryRow label="Tagline" value={siteSettings.site_tagline || "Ainda nao definida"} />
            <SummaryRow label="Imagem principal" value={siteSettings.hero_image ? "Configurada" : "Usando placeholder"} />
            <SummaryRow label="Imagem sobre" value={about.image_url ? "Configurada" : "Usando placeholder"} />
          </div>
        </PanelCard>

        <PanelCard title="Saude do painel" description="Indicadores simples para acompanhar a completude do conteudo.">
          <div className="space-y-4">
            <HealthLine label="Hero com descricao" ok={Boolean(siteSettings.hero_description?.trim())} />
            <HealthLine label="Sobre preenchido" ok={Boolean(about.content?.trim())} />
            <HealthLine label="Ao menos um servico" ok={counts.services > 0} />
            <HealthLine label="Ao menos um projeto" ok={counts.projects > 0} />
            <HealthLine label="Biblioteca com arquivos" ok={counts.media > 0} />
          </div>
        </PanelCard>
      </motion.div>
    </motion.div>
  );
}

function getTabDescription(tab: AdminTab) {
  switch (tab) {
    case "dashboard":
      return "Resumo rapido do conteudo publicado e do status geral do workspace.";
    case "hero":
      return "Edite o bloco principal da home, incluindo imagem, titulo e descricao.";
    case "about":
      return "Ajuste a narrativa institucional com texto completo e imagem de apoio.";
    case "services":
      return "Gerencie a lista de servicos oferecidos com criacao, edicao, exclusao e reordenacao por drag and drop.";
    case "projects":
      return "Organize portfolio, descricao detalhada, galerias, publicacao e ordem visual de cada projeto.";
    case "media":
      return "Central de uploads para imagens do site, com preview e copia de URL.";
    case "settings":
      return "Informacoes gerais da marca e textos reutilizados em outras areas do frontend.";
  }
}

function AdminLoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5efe6] px-4 text-[#3f2d20]">
      <motion.div
        className="flex items-center gap-3 rounded-full border border-[#e6d8c9] bg-[#fcfaf7] px-6 py-4 shadow-[0_16px_32px_rgba(63,45,32,0.08)]"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28 }}
      >
        <motion.span
          className="inline-block h-4 w-4 rounded-full border-2 border-transparent border-t-[#9f7b59] border-r-[#9f7b59]"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
        />
        <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d5544]">{label}</span>
      </motion.div>
    </div>
  );
}

function AdminAuthStateCard({
  actionLabel,
  description,
  eyebrow,
  onAction,
  secondaryDescription,
  title,
}: {
  actionLabel?: string;
  description: string;
  eyebrow: string;
  onAction?: () => void;
  secondaryDescription?: string;
  title: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5efe6] px-4 text-[#3f2d20]">
      <div className="max-w-lg rounded-[2rem] border border-[#e6d8c9] bg-[#fcfaf7] p-8 shadow-[0_24px_80px_rgba(63,45,32,0.08)]">
        <p className="text-[10px] uppercase tracking-[0.45em] text-[#9f7b59]">{eyebrow}</p>
        <h1 className="mt-4 text-3xl font-semibold text-[#2f2118]">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#7a6250]">{description}</p>
        {secondaryDescription ? <p className="mt-2 text-sm leading-relaxed text-[#8b7058]">{secondaryDescription}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {actionLabel && onAction ? <PrimaryButton label={actionLabel} onClick={onAction} /> : null}
          <Link
            to="/"
            className="rounded-full border border-[#d8c3ae] px-5 py-3 text-[11px] uppercase tracking-[0.25em] text-[#5a4434] transition hover:bg-[#efe3d5]"
          >
            Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5efe6] px-4 text-[#3f2d20]">
      <div className="max-w-lg rounded-[2rem] border border-[#e6d8c9] bg-[#fcfaf7] p-8 shadow-[0_24px_80px_rgba(63,45,32,0.08)]">
        <p className="text-[10px] uppercase tracking-[0.45em] text-[#9f7b59]">Erro</p>
        <h1 className="mt-4 text-3xl font-semibold text-[#2f2118]">Painel indisponivel</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#7a6250]">Nao foi possivel carregar os dados do Supabase agora.</p>
        <p className="mt-2 text-sm leading-relaxed text-[#8b7058]">{message}</p>
        <div className="mt-6">
          <PrimaryButton label="Tentar novamente" onClick={onRetry} />
        </div>
      </div>
    </div>
  );
}

function PanelCard({
  action,
  children,
  description,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <motion.section
      className="rounded-[1.8rem] border border-[#eadfd2] bg-[#fffdf9] p-6"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-[#2f2118]">{title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#7a6250]">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}

function NoticeBanner({ notice }: { notice: Exclude<Notice, null> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.24 }}
      className={`mt-6 rounded-[1.5rem] border px-5 py-4 text-sm ${
        notice.kind === "success"
          ? "border-[#d4e9d7] bg-[#eef8ef] text-[#27553a]"
          : "border-[#ecd2cd] bg-[#fff1ee] text-[#8f3d32]"
      }`}
    >
      {notice.message}
    </motion.div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-[#e2d2c2] bg-[#f7efe6] px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-[#6d5544]">
      {label}
    </div>
  );
}

function StatCard({ caption, label, value }: { caption: string; label: string; value: number }) {
  return (
    <motion.div className="rounded-[1.6rem] border border-[#eadfd2] bg-[#fffdf9] p-5" variants={fadeUpItem} whileHover={{ y: -4, scale: 1.015 }}>
      <div className="text-[10px] uppercase tracking-[0.35em] text-[#9f7b59]">{label}</div>
      <div className="mt-4 text-4xl font-semibold text-[#2f2118]">{value}</div>
      <p className="mt-3 text-sm leading-relaxed text-[#7a6250]">{caption}</p>
    </motion.div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-[#eadfd2] bg-[#f8f2ea] px-4 py-4">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#8f6d52]">{label}</div>
      <div className="mt-2 text-sm font-medium text-[#3f2d20]">{value}</div>
    </div>
  );
}

function HealthLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-[1.35rem] border border-[#eadfd2] bg-[#f8f2ea] px-4 py-4">
      <span className="text-sm text-[#5a4434]">{label}</span>
      <span className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.25em] ${ok ? "bg-[#e8f4ea] text-[#2b6b45]" : "bg-[#fdf0eb] text-[#a44a38]"}`}>
        {ok ? "Ok" : "Pendente"}
      </span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[#d8c3ae] bg-[#fbf6f0] px-4 py-8 text-center text-sm text-[#8b7058]">
      {label}
    </div>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8f6d52]">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[1.25rem] border border-[#ddcdbd] bg-[#fffdf9] px-4 py-3 text-sm text-[#3f2d20] outline-none transition placeholder:text-[#b69d87] focus:border-[#9f7b59]"
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  rows = 6,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  rows?: number;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8f6d52]">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[1.4rem] border border-[#ddcdbd] bg-[#fffdf9] px-4 py-3 text-sm text-[#3f2d20] outline-none transition placeholder:text-[#b69d87] focus:border-[#9f7b59]"
      />
    </label>
  );
}

function FileField({
  label,
  onChange,
}: {
  label: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="mt-3 block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8f6d52]">{label}</span>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="block w-full text-sm text-[#6d5544] file:mr-4 file:rounded-full file:border-0 file:bg-[#3f2d20] file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.25em] file:text-[#fffaf5]"
      />
    </label>
  );
}

function ToggleField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-[1.25rem] border border-[#ddcdbd] bg-[#fffdf9] px-4 py-3 text-sm text-[#5a4434]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#9f7b59]"
      />
      {label}
    </label>
  );
}

function ImagePreview({ alt, src }: { alt: string; src: string | null | undefined }) {
  const safeSrc = src?.trim() ? getAssetPreviewUrl(src, IMAGE_FALLBACK) : IMAGE_FALLBACK;

  return (
    <motion.div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[#eadfd2] bg-[#f8f2ea]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <img src={safeSrc} alt={alt} className="h-52 w-full object-cover" />
    </motion.div>
  );
}

function PrimaryButton({
  disabled,
  label,
  onClick,
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  const isLoading = disabled && /salvando|criando|enviando/i.test(label);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className="rounded-full bg-[#3f2d20] px-5 py-3 text-[11px] uppercase tracking-[0.25em] text-[#fffaf5] transition hover:bg-[#2f2118] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="inline-flex items-center gap-2">
        {isLoading ? (
          <motion.span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-transparent border-t-[#fffaf5] border-r-[#fffaf5]" animate={{ rotate: 360 }} transition={{ duration: 0.8, ease: "linear", repeat: Infinity }} />
        ) : null}
        {label}
      </span>
    </motion.button>
  );
}

function SecondaryButton({
  disabled,
  label,
  onClick,
  tone = "default",
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
  tone?: "danger" | "default";
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className={`rounded-full border px-5 py-3 text-[11px] uppercase tracking-[0.25em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
        tone === "danger" ? "border-[#dfbeb7] text-[#8c5b4d] hover:bg-[#fbefec]" : "border-[#d8c3ae] text-[#5a4434] hover:bg-[#efe3d5]"
      }`}
    >
      {label}
    </motion.button>
  );
}

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div {...pageTransition} className="will-change-transform">
      {children}
    </motion.div>
  );
}

function SortableCard({ children, id }: { children: ReactNode; id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? "z-20 opacity-80" : ""}`}>
      <DragHandleContext.Provider value={{ attributes, listeners }}>
        <motion.div variants={fadeUpItem} whileHover={{ y: -3, scale: 1.003 }} className="rounded-[1.7rem] border border-[#eadfd2] bg-[#f8f2ea] p-5 shadow-[0_12px_30px_rgba(63,45,32,0.05)]">
          {children}
        </motion.div>
      </DragHandleContext.Provider>
    </div>
  );
}

type DragHandleContextValue = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
} | null;

const DragHandleContext = createContext<DragHandleContextValue>(null);

function DragHandle() {
  const context = useContext(DragHandleContext);

  return (
    <button
      type="button"
      {...context?.attributes}
      {...context?.listeners}
      className="inline-flex cursor-grab items-center rounded-full border border-[#d8c3ae] bg-[#fffdf9] px-3 py-2 text-[11px] uppercase tracking-[0.25em] text-[#6b5443] active:cursor-grabbing"
    >
      Arrastar
    </button>
  );
}

function SortableGalleryCard({
  id,
  image,
  label,
  onRemove,
}: {
  id: string;
  image: string;
  label: string;
  onRemove: () => void | Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      whileHover={{ scale: 1.02, y: -3 }}
      className={`overflow-hidden rounded-[1.25rem] border border-[#eadfd2] bg-[#f6efe7] ${isDragging ? "z-20 opacity-80" : ""}`}
    >
      <img src={getAssetPreviewUrl(image, IMAGE_FALLBACK)} alt={label} className="h-40 w-full object-cover" />
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="rounded-full border border-[#d8c3ae] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[#6b5443]"
        >
          Mover
        </button>
        <span className="truncate text-xs text-[#8b7058]">{label}</span>
        <button type="button" onClick={() => void onRemove()} className="text-[11px] uppercase tracking-[0.25em] text-[#8c5b4d] transition hover:opacity-70">
          Remover
        </button>
      </div>
    </motion.div>
  );
}
