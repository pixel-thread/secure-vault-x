export const generatePassword = (
 length = 32,
 options: {
  useLowercase?: boolean;
  useUppercase?: boolean;
  useNumbers?: boolean;
  useSymbols?: boolean;
 } = {}
) => {
 const {
  useLowercase = true,
  useUppercase = true,
  useNumbers = true,
  useSymbols = true
 } = options;

 let chars = '';
 if (useLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
 if (useUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
 if (useNumbers) chars += '0123456789';
 if (useSymbols) chars += '!@#$%^&*()_+';

 // Fallback if nothing selected
 if (chars.length === 0) chars = 'abcdefghijklmnopqrstuvwxyz';

 let password = '';
 for (let i = 0; i < length; i++) {
  password += chars.charAt(Math.floor(Math.random() * chars.length));
 }
 return password;
};
