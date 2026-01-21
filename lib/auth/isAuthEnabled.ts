export const isAuthEnabled = () => {
  const mongo = process.env.MONGODB_URI?.trim();
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  const url = process.env.BETTER_AUTH_URL?.trim();
  return Boolean(mongo && secret && url);
};

