import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { petsApi } from "../../../../features/pets/api/pets.api";
import { PetForm } from "../../../../features/pets/PetForm";
import { extractErrorMessage } from "../../../../shared/api/client";
import { Screen } from "../../../../shared/components/Screen";
import { ErrorBanner, Loading } from "../../../../shared/components/States";

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const petQuery = useQuery({ queryKey: ["pets", id], queryFn: () => petsApi.get(id) });
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof petsApi.update>[1]) => petsApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pets"] });
      router.back();
    },
  });

  return (
    <Screen>
      {petQuery.isLoading ? <Loading /> : null}
      {petQuery.isError ? <ErrorBanner message={extractErrorMessage(petQuery.error)} /> : null}
      {petQuery.data ? (
        <PetForm pet={petQuery.data} submitting={mutation.isPending} error={mutation.isError ? extractErrorMessage(mutation.error) : null} onSubmit={(input) => mutation.mutate(input)} />
      ) : null}
    </Screen>
  );
}
