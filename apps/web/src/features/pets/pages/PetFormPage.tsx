import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PET_SPECIES_OPTIONS, PET_SPECIES_OTHER } from "@petcare/constants";
import { petsApi } from "../api/pets.api";
import { AvatarUploader } from "../components/AvatarUploader";
import { extractErrorMessage } from "../../../shared/api/client";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { LoadingState } from "../../../shared/components/LoadingState";

interface FormState {
  name: string;
  // One of PET_SPECIES_OPTIONS, or PET_SPECIES_OTHER — in which case
  // `customSpecies` holds the actual free-text value to submit.
  speciesOption: string;
  customSpecies: string;
  breed: string;
  birthDate: string;
  weight: string;
  notes: string;
  avatar: string | null;
}

const emptyForm: FormState = {
  name: "",
  speciesOption: PET_SPECIES_OPTIONS[0],
  customSpecies: "",
  breed: "",
  birthDate: "",
  weight: "",
  notes: "",
  avatar: null,
};

export function PetFormPage() {
  const { petId } = useParams();
  const isEdit = Boolean(petId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);

  const petQuery = useQuery({
    queryKey: ["pets", petId],
    queryFn: () => petsApi.get(petId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (petQuery.data) {
      const pet = petQuery.data;
      const isKnownSpecies = (PET_SPECIES_OPTIONS as readonly string[]).includes(pet.species);
      setForm({
        name: pet.name,
        speciesOption: isKnownSpecies ? pet.species : PET_SPECIES_OTHER,
        customSpecies: isKnownSpecies ? "" : pet.species,
        breed: pet.breed ?? "",
        birthDate: pet.birthDate ? pet.birthDate.slice(0, 10) : "",
        weight: pet.weight?.toString() ?? "",
        notes: pet.notes ?? "",
        avatar: pet.avatar,
      });
    }
  }, [petQuery.data]);

  const species = form.speciesOption === PET_SPECIES_OTHER ? form.customSpecies.trim() : form.speciesOption;

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? petsApi.update(petId!, {
            name: form.name,
            species,
            breed: form.breed || undefined,
            birthDate: form.birthDate || undefined,
            weight: form.weight ? Number(form.weight) : undefined,
            notes: form.notes || undefined,
            avatar: form.avatar ?? undefined,
          })
        : petsApi.create({
            name: form.name,
            species,
            breed: form.breed || undefined,
            birthDate: form.birthDate || undefined,
            weight: form.weight ? Number(form.weight) : undefined,
            notes: form.notes || undefined,
            avatar: form.avatar ?? undefined,
          }),
    onSuccess: (pet) => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      navigate(`/pets/${pet.id}`);
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  if (isEdit && petQuery.isLoading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-brand-900">
        {isEdit ? "Sửa hồ sơ thú cưng" : "Thêm thú cưng mới"}
      </h1>

      <form onSubmit={handleSubmit}>
      <Card className="flex flex-col gap-4 p-6">
        <AvatarUploader value={form.avatar} onChange={(url) => setForm((f) => ({ ...f, avatar: url }))} />

        {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}

        <TextField
          label="Tên thú cưng"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="species" className="text-sm font-medium text-brand-900">
            Loài
          </label>
          <select
            id="species"
            required
            value={form.speciesOption}
            onChange={(e) => setForm((f) => ({ ...f, speciesOption: e.target.value }))}
            className="rounded-xl border border-brand-200 bg-white px-4 py-3 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
          >
            {PET_SPECIES_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={PET_SPECIES_OTHER}>{PET_SPECIES_OTHER}</option>
          </select>
          {form.speciesOption === PET_SPECIES_OTHER ? (
            <input
              autoFocus
              required
              placeholder="Nhập loài thú cưng"
              value={form.customSpecies}
              onChange={(e) => setForm((f) => ({ ...f, customSpecies: e.target.value }))}
              className="rounded-xl border border-brand-200 px-4 py-3 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
            />
          ) : null}
        </div>

        <TextField
          label="Giống (không bắt buộc)"
          value={form.breed}
          onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
        />

        <TextField
          label="Ngày sinh (không bắt buộc)"
          type="date"
          value={form.birthDate}
          onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
        />

        <TextField
          label="Cân nặng (kg, không bắt buộc)"
          type="number"
          step="0.1"
          min="0"
          value={form.weight}
          onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-sm font-medium text-brand-900">
            Ghi chú (không bắt buộc)
          </label>
          <textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="rounded-xl border border-brand-200 px-4 py-3 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
          />
        </div>

        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? "Lưu thay đổi" : "Tạo hồ sơ"}
        </Button>
      </Card>
      </form>
    </div>
  );
}
