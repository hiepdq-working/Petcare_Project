import { useState } from "react";
import { View } from "react-native";
import { PET_SPECIES_OPTIONS, PET_SPECIES_OTHER } from "@petcare/constants";
import type { CreatePetRequest, PetDto } from "@petcare/types";
import { Button } from "../../shared/components/Button";
import { Chips } from "../../shared/components/Chips";
import { DateField } from "../../shared/components/DateField";
import { ImagePickerField } from "../../shared/components/ImagePickerField";
import { TextField } from "../../shared/components/TextField";
import { ErrorBanner } from "../../shared/components/States";
import { toDateKey } from "../../shared/utils/format";

interface PetFormProps {
  pet?: PetDto;
  submitting: boolean;
  error: string | null;
  onSubmit: (input: CreatePetRequest) => void;
}

export function PetForm({ pet, submitting, error, onSubmit }: PetFormProps) {
  const isKnown = pet ? (PET_SPECIES_OPTIONS as readonly string[]).includes(pet.species) : true;
  const [name, setName] = useState(pet?.name ?? "");
  const [speciesOption, setSpeciesOption] = useState<string>(pet ? (isKnown ? pet.species : PET_SPECIES_OTHER) : PET_SPECIES_OPTIONS[0]);
  const [customSpecies, setCustomSpecies] = useState(pet && !isKnown ? pet.species : "");
  const [breed, setBreed] = useState(pet?.breed ?? "");
  const [birthDate, setBirthDate] = useState<Date | null>(pet?.birthDate ? new Date(pet.birthDate) : null);
  const [weight, setWeight] = useState(pet?.weight ? String(pet.weight) : "");
  const [notes, setNotes] = useState(pet?.notes ?? "");
  const [avatar, setAvatar] = useState<string | null>(pet?.avatar ?? null);

  const species = speciesOption === PET_SPECIES_OTHER ? customSpecies.trim() : speciesOption;
  const canSubmit = name.trim().length > 0 && species.length > 0;

  return (
    <View style={{ gap: 14 }}>
      {error ? <ErrorBanner message={error} /> : null}
      <ImagePickerField value={avatar} onChange={setAvatar} />
      <TextField label="Tên thú cưng" value={name} onChangeText={setName} />
      <Chips
        label="Loài"
        value={speciesOption}
        onChange={setSpeciesOption}
        options={[...PET_SPECIES_OPTIONS, PET_SPECIES_OTHER].map((s) => ({ value: s, label: s }))}
      />
      {speciesOption === PET_SPECIES_OTHER ? (
        <TextField label="Nhập loài" value={customSpecies} onChangeText={setCustomSpecies} />
      ) : null}
      <TextField label="Giống (không bắt buộc)" value={breed} onChangeText={setBreed} />
      <DateField label="Ngày sinh (không bắt buộc)" value={birthDate} onChange={setBirthDate} maximumDate={new Date()} />
      <TextField label="Cân nặng kg (không bắt buộc)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
      <TextField label="Ghi chú (không bắt buộc)" value={notes} onChangeText={setNotes} multiline />
      <Button
        title={pet ? "Lưu thay đổi" : "Thêm thú cưng"}
        loading={submitting}
        disabled={!canSubmit}
        onPress={() =>
          onSubmit({
            name: name.trim(),
            species,
            breed: breed.trim() || undefined,
            birthDate: birthDate ? toDateKey(birthDate) : undefined,
            weight: weight ? Number(weight.replace(",", ".")) : undefined,
            notes: notes.trim() || undefined,
            avatar: avatar ?? undefined,
          })
        }
      />
    </View>
  );
}
