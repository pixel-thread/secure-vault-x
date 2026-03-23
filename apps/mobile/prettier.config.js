module.exports = {
  ...require('@securevault/config-prettier'),
  plugins: [require.resolve('prettier-plugin-tailwindcss')],
  tailwindAttributes: ['className'],
};
