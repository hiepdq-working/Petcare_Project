import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { petsApi } from "../../../features/pets/api/pets.api";
import { PetForm } from "../../../features/pets/PetForm";
import { extractErrorMessage } from "../../../shared/api/client";
import { Screen } from "../../../shared/components/Screen";

export default function NewPetScreen() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: petsApi.create,
    onSuccess: (pet) => {
      void queryClient.invalidateQueries({ queryKey: ["pets"] });
      router.replace(`/pet/${pet.id}`);
    },
  });
  return (
    <Screen>
      <PetForm submitting={mutation.isPending} error={mutation.isError ? extractErrorMessage(mutation.error) : null} onSubmit={(input) => mutation.mutate(input)} />
    </Screen>
  );
}
