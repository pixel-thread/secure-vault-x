import * as React from "react";
import { View } from "react-native";
import { useColorScheme } from "nativewind";
import { StatusBar } from "expo-status-bar";
import { cn } from "../lib/utils";

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: "light" | "dark";
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const { colorScheme, setColorScheme } = useColorScheme();

  React.useEffect(() => {
    if (initialTheme && initialTheme !== colorScheme) {
      setColorScheme(initialTheme);
    }
  }, [initialTheme, colorScheme, setColorScheme]);

  return (
    <View className={cn("flex-1", colorScheme === "dark" && "dark")}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      {children}
    </View>
  );
}
