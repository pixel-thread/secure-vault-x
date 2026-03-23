import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Controller, Control, FieldErrors, FieldValues, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

// --- Reusable Form Field Component ---
interface FormFieldProps<T extends FieldValues> extends TextInputProps {
  label: string;
  name: Path<T>;
  control: Control<T>;
  errors: FieldErrors<T>;
  isDarkMode: boolean;
  extraElement?: React.ReactNode;
  leftIconName?: keyof typeof Ionicons.glyphMap;
}

export const FormField = <T extends FieldValues>({
  label,
  name,
  control,
  errors,
  isDarkMode,
  extraElement,
  leftIconName,
  ...props
}: FormFieldProps<T>) => (
  <View className="mb-5">
    <Text className="mb-2 ml-1 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
      {label}
    </Text>
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <>
          <View className="relative justify-center">
            {leftIconName && (
              <View className="absolute left-4 z-10 items-center justify-center">
                <Ionicons
                  name={leftIconName}
                  size={20}
                  color={isDarkMode ? '#52525b' : '#a1a1aa'}
                />
              </View>
            )}
            <TextInput
              className={`rounded-3xl border bg-zinc-50 py-4 text-zinc-900 focus:bg-white dark:bg-zinc-900/40 dark:text-white dark:focus:bg-zinc-900/80 ${
                errors[name] ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
              } ${leftIconName ? 'pl-11' : 'px-5'} ${extraElement ? 'pr-14' : 'pr-5'}`}
              placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              {...props}
            />
            {extraElement && (
              <View className="absolute right-2 z-10 items-center justify-center">
                {extraElement}
              </View>
            )}
          </View>
          {errors[name] && (
            <Text className="ml-2 mt-1 text-xs font-medium text-rose-500">
              {String(errors[name]?.message || '')}
            </Text>
          )}
        </>
      )}
    />
  </View>
);
