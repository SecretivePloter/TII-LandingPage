// Shared helpers for the admin serverless functions.
// Files/folders prefixed with `_` are NOT treated as routes by Vercel, so this
// is a safe place for shared code that only the /api/* handlers import.

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// How long an admin session token stays valid after login.
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

// A session token is `<payload>.<hmac>` where payload is base64url(JSON) and the
// signature is HMAC-SHA256 over the payload using SESSION_SECRET. No DB, no
// external store — stateless and good enough for a single-admin panel.
function issueToken(secret) {
  const payload = b64url(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }));
  const sig = b64url(crypto.createHmac('sha256', secret).update(payload).digest());
  return `${payload}.${sig}`;
}

function verifyToken(token, secret) {
  if (!token || typeof token !== 'string' || !secret) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;

  const expected = b64url(crypto.createHmac('sha256', secret).update(payload).digest());
  // Constant-time compare so we don't leak the signature byte-by-byte via timing.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const { exp } = JSON.parse(fromB64url(payload).toString('utf8'));
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

// Pull the bearer token from the Authorization header and validate it. Returns
// true/false; the caller is responsible for sending the 401.
function isAuthed(req) {
  const header = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  return verifyToken(token, process.env.SESSION_SECRET);
}

// Service-role client. This key bypasses RLS, so it must ONLY ever exist
// server-side (never shipped to the browser).
function serviceClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Derive the in-bucket storage path from a stored public URL, e.g.
// https://xxx.supabase.co/storage/v1/object/public/proof-assets/testimoni/123.png
// -> testimoni/123.png
function storagePathFromUrl(fileUrl) {
  const marker = '/proof-assets/';
  const i = fileUrl.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(fileUrl.slice(i + marker.length));
}

// Small helper so every handler reads the JSON body the same way. Vercel's Node
// runtime auto-parses application/json into req.body, but we fall back to reading
// the raw stream just in case.
async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

module.exports = {
  issueToken,
  verifyToken,
  isAuthed,
  serviceClient,
  storagePathFromUrl,
  readJsonBody,
  BUCKET: 'proof-assets',
};
