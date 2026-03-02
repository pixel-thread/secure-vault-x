import { View, Text } from 'react-native';

interface HeaderProps {
 title: string;
 subtitle: string;
 rightElement?: React.ReactNode;
}

export default function Header({ title, subtitle, rightElement }: HeaderProps) {
 return (
  <View className="z-10 flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-900/80 bg-white/90 dark:bg-[#09090b]/90 px-6 pb-6 pt-12">
   <View>
    <Text className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
     {title}
    </Text>
    <Text className="mt-1 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
     {subtitle}
    </Text>
   </View>
   {rightElement && <View>{rightElement}</View>}
  </View>
 );
}
