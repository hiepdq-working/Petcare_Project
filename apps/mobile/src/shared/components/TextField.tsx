import { TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "./AppText";
import { useBrand } from "../../theme";

interface TextFieldProps extends TextInputProps {
  label?: string;
}

export function TextField({ label, style, multiline, ...props }: TextFieldProps) {
  const brand = useBrand();
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <AppText variant="small" style={{ fontFamily: "Inter_500Medium" }}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={brand[700] + "80"}
        style={[
          {
            borderWidth: 1,
            borderColor: brand[200],
            backgroundColor: "#fff",
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: "Inter_400Regular",
            fontSize: 15,
            color: brand[900],
            minHeight: multiline ? 90 : undefined,
            textAlignVertical: multiline ? "top" : "center",
          },
          style,
        ]}
      />
    </View>
  );
}
