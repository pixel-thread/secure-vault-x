import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';

// --- Reusable Form Field Component ---
interface FormFieldProps extends TextInputProps {
  label: string;
  name: string;
  control: Control<any>;
  errors: FieldErrors<any>;
  isDarkMode: boolean;
  extraElement?: React.ReactNode;
}

export const FormField = ({
  label,
  name,
  control,
  errors,
  isDarkMode,
  extraElement,
  ...props
}: FormFieldProps) => (
  <View className="mb-4">
    <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
      {label}
    </Text>
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <>
          <View className="relative">
            <TextInput
              className={`rounded-2xl border bg-zinc-50 px-5 py-4 text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                errors[name] ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
              } ${extraElement ? 'pr-20' : ''}`}
              placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              {...props}
            />
            {extraElement && (
              <View className="absolute bottom-0 right-0 top-0 flex-row items-center pr-2">
                {extraElement}
              </View>
            )}
          </View>
          {errors[name] && (
            <Text className="ml-2 mt-1 text-xs text-red-500">
              {errors[name]?.message as string}
            </Text>
          )}
        </>
      )}
    />
  </View>
);
