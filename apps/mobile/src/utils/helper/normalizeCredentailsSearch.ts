export const normalizeCredentailSearch = (raw: string) => {
  if (!raw) return '';
  let s = raw.toLowerCase().trim();
  s = s.replace(/^https?:\/\//, '').split('/')[0];
  const common = ['com.', '.android', '.com', '.net', '.org', '.co.uk', 'www.'];
  common.forEach((it) => {
    s = s.replace(it, '');
  });
  return s.replace(/[^a-z0-9]/g, '');
};
