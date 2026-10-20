import { Text, type TextProps, type TextStyle } from "react-native";
import { fonts, useBrand } from "../../theme";

type Variant = "display" | "title" | "body" | "semi" | "small" | "caption" | "label";

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 26 },
  title: { fontFamily: fonts.display, fontSize: 19 },
  body: { fontFamily: fonts.sans, fontSize: 15 },
  semi: { fontFamily: fonts.sansSemi, fontSize: 15 },
  small: { fontFamily: fonts.sans, fontSize: 13 },
  caption: { fontFamily: fonts.sans, fontSize: 12 },
  label: { fontFamily: fonts.sansSemi, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase" },
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: "default" | "muted" | "brand" | "danger" | "white";
}

export function AppText({ variant = "body", tone = "default", style, ...props }: AppTextProps) {
  const brand = useBrand();
  const color =
    tone === "muted" ? brand[700] + "b3" : tone === "brand" ? brand[700] : tone === "danger" ? "#dc2626" : tone === "white" ? "#fff" : brand[900];
  return <Text {...props} style={[VARIANTS[variant], { color }, style]} />;
}
