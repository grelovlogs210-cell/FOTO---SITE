import { useEffect, useState, type ReactNode } from "react";
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
  getSiteSettings,
  type AboutRow,
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
  portfolio: PortfolioRow[];
  services: ServiceRow[];
  siteSettings: SiteSettingsRow | null;
};

type Notice = {
  kind: "error" | "success";
  message: string;
} | null;

const ADMIN_QUERY_KEY = ["admin-content"];
const AUTHORIZED_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? "SEU_EMAIL@gmail.com").toLowerCase();

const emptySiteSettings = {
  hero_title: "",
  hero_subtitle: "",
  hero_description: "",
  hero_image: "",
};

const emptyAbout = {
  content: "",
  image_url: "",
};

function AdminPage() {
  const [authState, setAuthState] = useState<
    "checking" | "signed_out" | "unauthorized" | "authorized" | "unconfigured"
  >("checking");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<Notice>(null);
  const [siteSettingsForm, setSiteSettingsForm] = useState(emptySiteSettings);
  const [aboutForm, setAboutForm] = useState(emptyAbout);

  const adminQuery = useQuery<AdminContent>({
    queryKey: ADMIN_QUERY_KEY,
    enabled: authState === "authorized",
    queryFn: async () => {
      const [siteSettings, about, services, portfolio] = await Promise.all([
        getSiteSettings(),
        getAbout(),
        getAdminServices(),
        getAdminPortfolio(),
      ]);

      return {
        about,
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

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError) {
        applyUserAccess(null);
        return;
      }

      const email = userData.user?.email?.toLowerCase() ?? null;
      applyUserAccess(email);
    };

    void syncSession();

    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      const email = session?.user.email?.toLowerCase() ?? null;
      applyUserAccess(email);
    });

    return () => {
      isMounted = false;
      authListener.data?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const siteSettings = adminQuery.data?.siteSettings;
    const about = adminQuery.data?.about;

    setSiteSettingsForm({
      hero_title: siteSettings?.hero_title ?? "",
      hero_subtitle: siteSettings?.hero_subtitle ?? "",
      hero_description: siteSettings?.hero_description ?? "",
      hero_image: siteSettings?.hero_image ?? "",
    });

    setAboutForm({
      content: about?.content ?? "",
      image_url: about?.image_url ?? "",
    });
  }, [adminQuery.data]);

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["site-content"] }),
    ]);
  };

  const handleSuccess = async (message: string) => {
    setNotice({ kind: "success", message });
    await refreshAll();
  };

  const handleError = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback;
    setNotice({ kind: "error", message });
  };

  const handleImageUpload = async (
    file: File | null,
    onComplete: (storageValue: string) => void,
    successMessage: string,
  ) => {
    if (!file) {
      return;
    }

    try {
      const upload = await uploadUserAsset(file);
      onComplete(upload.storageValue);
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

  const siteSettingsMutation = useMutation({
    mutationFn: () =>
      upsertSiteSettings(siteSettingsForm, adminQuery.data?.siteSettings?.id),
    onSuccess: async () => {
      await handleSuccess("Hero atualizado com sucesso.");
    },
    onError: (error) => {
      handleError(error, "Nao foi possivel salvar o hero.");
    },
  });

  const aboutMutation = useMutation({
    mutationFn: () => upsertAbout(aboutForm, adminQuery.data?.about?.id),
    onSuccess: async () => {
      await handleSuccess("Sobre atualizado com sucesso.");
    },
    onError: (error) => {
      handleError(error, "Nao foi possivel salvar a secao sobre.");
    },
  });

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
    <div className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-stone-800 bg-stone-900/90 p-6 shadow-2xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Painel administrativo</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Editar conteudo do site</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-300">
              Atualize hero, sobre, servicos e portfolio diretamente no Supabase por esta tela.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs leading-relaxed text-stone-400 sm:block">
              <div className="uppercase tracking-[0.25em] text-stone-500">Conta</div>
              <div className="mt-1 text-stone-300">{userEmail}</div>
            </div>
            <button
              type="button"
              onClick={() => void adminQuery.refetch()}
              className="rounded-full border border-stone-700 px-5 py-3 text-xs uppercase tracking-[0.25em] text-stone-200 transition hover:border-amber-300 hover:text-amber-200"
            >
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-full border border-stone-700 px-5 py-3 text-xs uppercase tracking-[0.25em] text-stone-200 transition hover:border-red-300 hover:text-red-200"
            >
              Sair
            </button>
            <Link
              to="/"
              className="rounded-full bg-amber-300 px-5 py-3 text-xs uppercase tracking-[0.25em] text-stone-950 transition hover:bg-amber-200"
            >
              Ver site
            </Link>
          </div>
        </div>

        {notice ? <NoticeBanner notice={notice} /> : null}

        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/90 p-6">
          <SectionHeader
            title="Hero"
            description="Edite o conteudo principal exibido no topo da home."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field
              label="Titulo"
              value={siteSettingsForm.hero_title}
              onChange={(value) =>
                setSiteSettingsForm((current) => ({ ...current, hero_title: value }))
              }
            />
            <Field
              label="Subtitulo"
              value={siteSettingsForm.hero_subtitle}
              onChange={(value) =>
                setSiteSettingsForm((current) => ({ ...current, hero_subtitle: value }))
              }
            />
            <div className="md:col-span-2">
              <Field
                label="Imagem"
                value={siteSettingsForm.hero_image}
                onChange={(value) =>
                  setSiteSettingsForm((current) => ({ ...current, hero_image: value }))
                }
                placeholder="https://... ou storage:site-assets/arquivo.jpg"
              />
              <FileField
                label="Upload da imagem do hero"
                onChange={(file) =>
                  void handleImageUpload(
                    file,
                    (storageValue) =>
                      setSiteSettingsForm((current) => ({ ...current, hero_image: storageValue })),
                    "Imagem do hero enviada com sucesso.",
                  )
                }
              />
            </div>
            <div className="md:col-span-2">
              <TextAreaField
                label="Descricao"
                value={siteSettingsForm.hero_description}
                onChange={(value) =>
                  setSiteSettingsForm((current) => ({ ...current, hero_description: value }))
                }
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
        </section>

        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/90 p-6">
          <SectionHeader
            title="Sobre"
            description="Edite o texto e a imagem da secao institucional."
          />
          <div className="mt-6 grid gap-4">
            <Field
              label="Imagem"
              value={aboutForm.image_url}
              onChange={(value) => setAboutForm((current) => ({ ...current, image_url: value }))}
              placeholder="https://... ou storage:site-assets/arquivo.jpg"
            />
            <FileField
              label="Upload da imagem sobre"
              onChange={(file) =>
                void handleImageUpload(
                  file,
                  (storageValue) => setAboutForm((current) => ({ ...current, image_url: storageValue })),
                  "Imagem da secao sobre enviada com sucesso.",
                )
              }
            />
            <TextAreaField
              label="Conteudo"
              value={aboutForm.content}
              onChange={(value) => setAboutForm((current) => ({ ...current, content: value }))}
              rows={8}
            />
          </div>
          <div className="mt-6">
            <PrimaryButton
              label={aboutMutation.isPending ? "Salvando..." : "Salvar sobre"}
              onClick={() => aboutMutation.mutate()}
              disabled={aboutMutation.isPending}
            />
          </div>
        </section>

        <CollectionSection<ServiceRow>
          title="Servicos"
          description="Crie, edite e remova servicos exibidos na home."
          items={adminQuery.data.services}
          createEmptyItem={() => ({
            id: `new-service-${crypto.randomUUID()}`,
            user_id: "",
            title: "",
            description: "",
          })}
          renderFields={(item, onChange) => (
            <>
              <Field
                label="Titulo"
                value={item.title}
                onChange={(value) => onChange({ ...item, title: value })}
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label="Descricao"
                  value={item.description}
                  onChange={(value) => onChange({ ...item, description: value })}
                  rows={5}
                />
              </div>
            </>
          )}
          getKey={(item) => item.id}
          isNewItem={(item) => item.id.startsWith("new-service-")}
          onSave={async (item) => {
            if (item.id.startsWith("new-service-")) {
              await createService({
                title: item.title,
                description: item.description,
              });
              await handleSuccess("Servico criado com sucesso.");
              return;
            }

            await updateService(item.id, {
              title: item.title,
              description: item.description,
            });
            await handleSuccess("Servico atualizado com sucesso.");
          }}
          onDelete={async (item) => {
            if (item.id.startsWith("new-service-")) {
              return;
            }

            await deleteService(item.id);
            await handleSuccess("Servico excluido com sucesso.");
          }}
          onError={handleError}
        />

        <CollectionSection<PortfolioRow>
          title="Portfolio"
          description="Gerencie projetos, categorias, imagem e status de publicacao."
          items={adminQuery.data.portfolio}
          createEmptyItem={() => ({
            id: `new-portfolio-${crypto.randomUUID()}`,
            user_id: "",
            title: "",
            category: "",
            image_url: "",
            is_published: true,
          })}
          renderFields={(item, onChange) => (
            <>
              <Field
                label="Titulo"
                value={item.title}
                onChange={(value) => onChange({ ...item, title: value })}
              />
              <Field
                label="Categoria"
                value={item.category}
                onChange={(value) => onChange({ ...item, category: value })}
              />
              <div className="md:col-span-2">
                <Field
                  label="Imagem"
                  value={item.image_url}
                  onChange={(value) => onChange({ ...item, image_url: value })}
                  placeholder="https://... ou storage:site-assets/arquivo.jpg"
                />
                <FileField
                  label="Upload da imagem do projeto"
                  onChange={(file) =>
                    void handleImageUpload(
                      file,
                      (storageValue) => onChange({ ...item, image_url: storageValue }),
                      "Imagem do projeto enviada com sucesso.",
                    )
                  }
                />
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 py-3 text-sm text-stone-200">
                <input
                  type="checkbox"
                  checked={item.is_published}
                  onChange={(event) => onChange({ ...item, is_published: event.target.checked })}
                  className="h-4 w-4 accent-amber-300"
                />
                Publicado
              </label>
            </>
          )}
          getKey={(item) => item.id}
          isNewItem={(item) => item.id.startsWith("new-portfolio-")}
          onSave={async (item) => {
            if (item.id.startsWith("new-portfolio-")) {
              await createPortfolio({
                title: item.title,
                category: item.category,
                image_url: item.image_url,
                is_published: item.is_published,
              });
              await handleSuccess("Projeto criado com sucesso.");
              return;
            }

            await updatePortfolio(item.id, {
              title: item.title,
              category: item.category,
              image_url: item.image_url,
              is_published: item.is_published,
            });
            await handleSuccess("Projeto atualizado com sucesso.");
          }}
          onDelete={async (item) => {
            if (item.id.startsWith("new-portfolio-")) {
              return;
            }

            await deletePortfolio(item.id);
            await handleSuccess("Projeto excluido com sucesso.");
          }}
          onError={handleError}
        />
      </div>
    </div>
  );
}

function CollectionSection<TItem extends { id: string }>({
  title,
  description,
  items,
  createEmptyItem,
  renderFields,
  getKey,
  isNewItem,
  onSave,
  onDelete,
  onError,
}: {
  title: string;
  description: string;
  items: TItem[];
  createEmptyItem: () => TItem;
  renderFields: (item: TItem, onChange: (next: TItem) => void) => ReactNode;
  getKey: (item: TItem) => string;
  isNewItem: (item: TItem) => boolean;
  onSave: (item: TItem) => Promise<void>;
  onDelete: (item: TItem) => Promise<void>;
  onError: (error: unknown, fallback: string) => void;
}) {
  const [drafts, setDrafts] = useState<TItem[]>(items);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(items);
  }, [items]);

  const updateItem = (id: string, next: TItem) => {
    setDrafts((current) => current.map((item) => (getKey(item) === id ? next : item)));
  };

  const removeDraft = (id: string) => {
    setDrafts((current) => current.filter((item) => getKey(item) !== id));
  };

  return (
    <section className="rounded-[2rem] border border-stone-800 bg-stone-900/90 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader title={title} description={description} />
        <button
          type="button"
          onClick={() => setDrafts((current) => [createEmptyItem(), ...current])}
          className="rounded-full border border-amber-300 px-5 py-3 text-xs uppercase tracking-[0.25em] text-amber-200 transition hover:bg-amber-300 hover:text-stone-950"
        >
          Novo
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {drafts.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-stone-700 px-4 py-8 text-center text-sm text-stone-400">
            Nenhum item cadastrado ainda.
          </div>
        ) : null}

        {drafts.map((item) => {
          const id = getKey(item);
          const busy = busyId === id;

          return (
            <div key={id} className="rounded-[1.75rem] border border-stone-800 bg-stone-950/70 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                {renderFields(item, (next) => updateItem(id, next))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <PrimaryButton
                  label={busy ? "Salvando..." : isNewItem(item) ? "Criar" : "Salvar"}
                  onClick={async () => {
                    setBusyId(id);

                    try {
                      await onSave(item);
                    } catch (error) {
                      onError(error, "Nao foi possivel salvar este item.");
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (isNewItem(item)) {
                      removeDraft(id);
                      return;
                    }

                    setBusyId(id);

                    try {
                      await onDelete(item);
                    } catch (error) {
                      onError(error, "Nao foi possivel excluir este item.");
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  className="rounded-full border border-red-400/50 px-5 py-3 text-xs uppercase tracking-[0.25em] text-red-200 transition hover:bg-red-500/10"
                  disabled={busy}
                >
                  {isNewItem(item) ? "Descartar" : "Excluir"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AdminLoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 px-4 text-stone-100">
      <div className="flex items-center gap-3 rounded-full border border-stone-800 bg-stone-900 px-5 py-4">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-amber-300 border-r-amber-300" />
        <span className="text-xs uppercase tracking-[0.3em] text-stone-300">{label}</span>
      </div>
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
    <div className="flex min-h-screen items-center justify-center bg-stone-950 px-4 text-stone-100">
      <div className="max-w-lg rounded-[2rem] border border-stone-800 bg-stone-900 p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-300">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-300">{description}</p>
        {secondaryDescription ? (
          <p className="mt-2 text-sm leading-relaxed text-stone-400">{secondaryDescription}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {actionLabel && onAction ? <PrimaryButton label={actionLabel} onClick={onAction} /> : null}
          <Link
            to="/"
            className="rounded-full border border-stone-700 px-5 py-3 text-xs uppercase tracking-[0.25em] text-stone-200 transition hover:border-amber-300 hover:text-amber-200"
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
    <div className="flex min-h-screen items-center justify-center bg-stone-950 px-4 text-stone-100">
      <div className="max-w-lg rounded-[2rem] border border-stone-800 bg-stone-900 p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Erro</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Painel indisponivel</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-300">
          Nao foi possivel carregar os dados do Supabase agora.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-400">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryButton label="Tentar novamente" onClick={onRetry} />
          <Link
            to="/"
            className="rounded-full border border-stone-700 px-5 py-3 text-xs uppercase tracking-[0.25em] text-stone-200 transition hover:border-amber-300 hover:text-amber-200"
          >
            Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}

function NoticeBanner({ notice }: { notice: Exclude<Notice, null> }) {
  return (
    <div
      className={`rounded-[1.5rem] border px-5 py-4 text-sm ${
        notice.kind === "success"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
          : "border-red-500/40 bg-red-500/10 text-red-100"
      }`}
    >
      {notice.message}
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-300">{description}</p>
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
      <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-stone-400">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-700 bg-stone-950/80 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300"
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
      <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-stone-400">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[1.5rem] border border-stone-700 bg-stone-950/80 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300"
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
      <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-stone-500">{label}</span>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="block w-full text-sm text-stone-300 file:mr-4 file:rounded-full file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.2em] file:text-stone-950"
      />
    </label>
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
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-amber-300 px-5 py-3 text-xs uppercase tracking-[0.25em] text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
