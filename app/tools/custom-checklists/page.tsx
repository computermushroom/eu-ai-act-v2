// Custom Industry Checklist Tool
// Client Component: create, manage, and track custom compliance checklists

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface AISystem {
  id: string;
  name: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Checklist {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
  systemId: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomChecklistsPage() {
  const t = useTranslations();

  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [activeChecklistId, setActiveChecklistId] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newItemText, setNewItemText] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Fetch AI systems
  useEffect(() => {
    async function fetchSystems() {
      try {
        const res = await fetch("/api/ai-systems");
        if (res.ok) {
          const data = await res.json();
          setSystems(data.data ?? []);
        }
      } catch {
        // Silently handle fetch errors
      }
    }
    fetchSystems();
  }, []);

  // Fetch saved checklists
  const fetchChecklists = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/documents?type=custom-checklist");
      if (res.ok) {
        const data = await res.json();
        const loaded: Checklist[] = (data.data ?? []).map(
          (doc: Record<string, unknown>) => ({
            id: doc.id as string,
            title: doc.title as string,
            description: (doc.description as string) ?? "",
            items: (doc.items as ChecklistItem[]) ?? [],
            systemId: (doc.systemId as string) ?? "",
            createdAt: (doc.createdAt as string) ?? new Date().toISOString(),
            updatedAt: (doc.updatedAt as string) ?? new Date().toISOString(),
          })
        );
        setChecklists(loaded);
        if (loaded.length > 0 && !activeChecklistId) {
          setActiveChecklistId(loaded[0]?.id ?? "");
        }
      }
    } catch {
      // Silently handle fetch errors
    } finally {
      setIsLoading(false);
    }
  }, [activeChecklistId]);

  useEffect(() => {
    fetchChecklists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save checklist via API
  const saveChecklist = useCallback(
    async (checklist: Checklist) => {
      try {
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "custom-checklist",
            title: checklist.title,
            description: checklist.description,
            items: checklist.items,
            systemId: checklist.systemId,
            documentId: checklist.id,
          }),
        });
        if (res.ok) {
          setSaveMessage(t("tools.saved"));
          setTimeout(() => setSaveMessage(""), 2000);
        } else {
          setSaveMessage(t("tools.errorSaving"));
          setTimeout(() => setSaveMessage(""), 2000);
        }
      } catch {
        setSaveMessage(t("tools.errorSaving"));
        setTimeout(() => setSaveMessage(""), 2000);
      }
    },
    []
  );

  const activeChecklist = checklists.find((c) => c.id === activeChecklistId);

  const handleCreateChecklist = () => {
    if (!newTitle.trim()) return;
    const newChecklist: Checklist = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      description: newDescription.trim(),
      items: [],
      systemId: selectedSystemId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setChecklists((prev) => [...prev, newChecklist]);
    setActiveChecklistId(newChecklist.id);
    setNewTitle("");
    setNewDescription("");
    setShowCreateForm(false);
    saveChecklist(newChecklist);
  };

  const handleDeleteChecklist = (id: string) => {
    setChecklists((prev) => prev.filter((c) => c.id !== id));
    if (activeChecklistId === id) {
      const remaining = checklists.filter((c) => c.id !== id);
      setActiveChecklistId(remaining.length > 0 ? remaining[0]?.id ?? "" : "");
    }
  };

  const handleAddItem = () => {
    if (!newItemText.trim() || !activeChecklist) return;
    const updated: Checklist = {
      ...activeChecklist,
      items: [
        ...activeChecklist.items,
        {
          id: crypto.randomUUID(),
          text: newItemText.trim(),
          checked: false,
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    setChecklists((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    setNewItemText("");
    saveChecklist(updated);
  };

  const handleToggleItem = (itemId: string) => {
    if (!activeChecklist) return;
    const updated: Checklist = {
      ...activeChecklist,
      items: activeChecklist.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
      updatedAt: new Date().toISOString(),
    };
    setChecklists((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    saveChecklist(updated);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!activeChecklist) return;
    const updated: Checklist = {
      ...activeChecklist,
      items: activeChecklist.items.filter((item) => item.id !== itemId),
      updatedAt: new Date().toISOString(),
    };
    setChecklists((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    saveChecklist(updated);
  };

  const getProgress = (checklist: Checklist) => {
    if (checklist.items.length === 0) return 0;
    return Math.round(
      (checklist.items.filter((i) => i.checked).length /
        checklist.items.length) *
        100
    );
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{t("tools.results")}          </span>
          <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">{t("tools.results")}          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Custom Industry Checklists</h1>
        <p className="text-muted-foreground">
          Create and manage custom compliance checklists tailored to your
          industry and AI systems.
        </p>
      </div>

      {/* System Selector */}
      <div className="mt-8">
        <label className="block text-sm font-medium">{t("tools.selectSystem")}</label>
        <select
          value={selectedSystemId}
          onChange={(e) => setSelectedSystemId(e.target.value)}
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("tools.selectSystem")}</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Checklist Tabs & Create */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("tools.results")}</h2>
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {showCreateForm ? "Cancel" : "+ Create New"}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mt-4 rounded-lg border border-border bg-background p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium">{t("tools.category")}</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t("tools.description")}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium">{t("tools.description")}</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t("tools.description")}
                rows={2}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateChecklist}
              disabled={!newTitle.trim()}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >{t("common.submit")}            </button>
          </div>
        )}

        {/* Checklist Tabs */}
        {checklists.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {checklists.map((cl) => (
              <div key={cl.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveChecklistId(cl.id)}
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    cl.id === activeChecklistId
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background hover:bg-muted"
                  }`}
                >
                  {cl.title}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteChecklist(cl.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Delete checklist"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Checklist Content */}
      {isLoading && (
        <div className="mt-8 text-sm text-muted-foreground">
          Loading checklists...
        </div>
      )}

      {!isLoading && checklists.length === 0 && !showCreateForm && (
        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("tools.noResults")}
          </p>
        </div>
      )}

      {activeChecklist && (
        <div className="mt-8 space-y-4">
          {/* Checklist Header */}
          <div className="rounded-lg border border-border bg-background p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">
                  {activeChecklist.title}
                </h3>
                {activeChecklist.description && (
                  <p className="text-sm text-muted-foreground">
                    {activeChecklist.description}
                  </p>
                )}
                {activeChecklist.systemId && (
                  <p className="text-xs text-muted-foreground">
                    {t("tools.selectSystem")}:{" "}
                    {systems.find((s) => s.id === activeChecklist.systemId)
                      ?.name ?? "Unknown"}
                  </p>
                )}
              </div>
              {saveMessage && (
                <span className="text-xs text-muted-foreground">
                  {saveMessage}
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("tools.results")} {activeChecklist.items.filter((i) => i.checked).length}{" "}
                  / {activeChecklist.items.length} items
                </span>
                <span className="font-medium">
                  {getProgress(activeChecklist)}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{
                    width: `${getProgress(activeChecklist)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Add Item */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddItem();
                }
              }}
              placeholder={t("tools.searchPlaceholder")}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newItemText.trim()}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >{t("common.submit")}            </button>
          </div>

          {/* Checklist Items */}
          {activeChecklist.items.length === 0 ? (
            <div className="rounded-lg border border-border border-dashed bg-muted/20 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t("tools.noResults")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeChecklist.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleItem(item.id)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      item.checked
                        ? "text-muted-foreground line-through"
                        : ""
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Delete item"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
