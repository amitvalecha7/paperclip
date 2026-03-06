import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "../context/CompanyContext";
import { secretsApi } from "../api/secrets";
import { Button } from "@/components/ui/button";
import { KeyRound, Plus, Trash2, Pencil, RefreshCw } from "lucide-react";
import type { CompanySecret, SecretProviderDescriptor, SecretProvider } from "@paperclipai/shared";
import { Field } from "../components/agent-config-primitives";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryKeys } from "../lib/queryKeys";

export function CompanyIntegrations() {
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<CompanySecret | null>(null);

  const [formName, setFormName] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formProvider, setFormProvider] = useState<SecretProvider>("local_encrypted");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: secrets, isLoading: isLoadingSecrets } = useQuery({
    queryKey: ["secrets", selectedCompanyId],
    queryFn: () => secretsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: providers, isLoading: isLoadingProviders } = useQuery({
    queryKey: ["secretProviders", selectedCompanyId],
    queryFn: () => secretsApi.providers(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof secretsApi.create>[1]) => secretsApi.create(selectedCompanyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets", selectedCompanyId] });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : "Failed to add secret"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof secretsApi.update>[1] }) =>
      secretsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets", selectedCompanyId] });
      setIsEditOpen(false);
      resetForm();
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : "Failed to edit secret"),
  });

  const rotateMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => secretsApi.rotate(id, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets", selectedCompanyId] });
      setIsEditOpen(false);
      resetForm();
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : "Failed to rotate secret"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => secretsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets", selectedCompanyId] });
    },
  });

  function resetForm() {
    setFormName("");
    setFormValue("");
    setFormProvider("local_encrypted");
    setFormDescription("");
    setFormError(null);
    setEditingSecret(null);
  }

  function handleOpenAdd() {
    resetForm();
    setIsAddOpen(true);
  }

  function handleOpenEdit(secret: CompanySecret) {
    resetForm();
    setEditingSecret(secret);
    setFormName(secret.name);
    setFormDescription(secret.description ?? "");
    setFormProvider(secret.provider);
    setIsEditOpen(true);
  }

  function handleSubmitAdd() {
    if (!formName.trim() || !formValue.trim() || !formProvider) {
      setFormError("Name, Value, and Provider are required.");
      return;
    }
    createMutation.mutate({
      name: formName.trim(),
      value: formValue.trim(),
      provider: formProvider,
      description: formDescription.trim() || null,
    });
  }

  function handleSubmitEdit() {
    if (!editingSecret) return;
    if (!formName.trim()) {
      setFormError("Name is required.");
      return;
    }
    
    // If a new value is provided, we rotate. Else we update metadata.
    if (formValue.trim()) {
      rotateMutation.mutate({ id: editingSecret.id, value: formValue.trim() });
    } else {
      updateMutation.mutate({
        id: editingSecret.id,
        data: {
          name: formName.trim(),
          description: formDescription.trim() || null,
        },
      });
    }
  }

  if (isLoadingSecrets || isLoadingProviders) {
    return <div className="text-sm text-muted-foreground py-4">Loading integrations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Integrations & Secrets
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleOpenAdd}>
          <Plus className="h-3 w-3 mr-1.5" />
          Add Integration
        </Button>
      </div>
      
      <div className="rounded-md border border-border">
        {secrets && secrets.length > 0 ? (
          <div className="divide-y divide-border">
            {secrets.map((secret) => (
              <div key={secret.id} className="flex items-center justify-between p-4">
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-0.5 shrink-0 bg-muted/50 p-2 rounded-md">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{secret.name}</span>
                      <span className="text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                        {secret.provider}
                      </span>
                      {secret.latestVersion > 1 && (
                        <span className="text-[10px] text-muted-foreground">v{secret.latestVersion}</span>
                      )}
                    </div>
                    {secret.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{secret.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpenEdit(secret)}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive" 
                      onClick={() => {
                        if (confirm(`Delete integration ${secret.name}?`)) {
                          removeMutation.mutate(secret.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <KeyRound className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
            <h3 className="text-sm font-medium">No integrations added</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Store your API keys for LLMs (OpenAI, Anthropic, OpenRouter) and external tools (GitHub, Jira, Linear) centrally here.
            </p>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Integration / Secret</DialogTitle>
            <DialogDescription>
              Store an API key or configuration snippet securely for your agents to use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Name" hint="A recognizable name, e.g., 'OPENAI_API_KEY' or 'GITHUB_TOKEN'">
              <input
                className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none font-mono"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Secret Value" hint="The actual secret token or string.">
              <input
                type="password"
                className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none font-mono"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder="sk-..."
              />
            </Field>
            <Field label="Provider" hint="How to store the secret. 'local_encrypted' is default on-prem.">
              <Select value={formProvider} onValueChange={(val) => setFormProvider(val as SecretProvider)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Description (optional)" hint="Notes about what this is used for.">
              <textarea
                className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none resize-none"
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </Field>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitAdd} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save secret"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Rotate Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Secret: {editingSecret?.name}</DialogTitle>
            <DialogDescription>
              Update the metadata, or provide a new secret value to rotate it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Name">
              <input
                className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none font-mono"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </Field>
            <Field label="Description">
              <textarea
                className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none resize-none"
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </Field>
            <div className="border-t border-border pt-4">
              <Field label="Rotate API Key (optional)" hint="Leave blank to keep current secret. If you provide a value, it will rotate to a new version.">
                <input
                  type="password"
                  className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none font-mono placeholder:text-muted-foreground/50"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="Enter new secret value to rotate"
                />
              </Field>
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitEdit} 
              disabled={updateMutation.isPending || rotateMutation.isPending}
            >
              {formValue ? "Rotate Secret" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
