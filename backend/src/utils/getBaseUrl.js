export default function getBaseUrl(req) {
  const fromEnv = process.env.APP_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}
