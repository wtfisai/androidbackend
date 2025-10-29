const config = require('../config');

function isSafeString(value) {
  if (typeof value !== 'string') return false;
  const forbidden = /[`$\\]|\$\(|;|&&|\|\||\|/g; // common shell metachars
  if (forbidden.test(value)) return false;
  for (const pat of config.shell.dangerousPatterns) {
    if (pat.test(value)) return false;
  }
  return true;
}

function assertSafeString(label, value) {
  if (value === undefined || value === null) return;
  if (!isSafeString(String(value))) {
    const err = new Error(`${label} contains unsafe characters`);
    err.code = 'UNSAFE_INPUT';
    throw err;
  }
}

function safeIdentifier(label, value, re) {
  if (value === undefined || value === null) return undefined;
  const str = String(value);
  if (!re.test(str)) {
    const err = new Error(`${label} has invalid format`);
    err.code = 'INVALID_INPUT';
    throw err;
  }
  return str;
}

function safeInt(label, value, opts = {}) {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    const err = new Error(`${label} must be an integer`);
    err.code = 'INVALID_INPUT';
    throw err;
  }
  if (opts.min !== undefined && n < opts.min) {
    const err = new Error(`${label} must be >= ${opts.min}`);
    err.code = 'INVALID_INPUT';
    throw err;
  }
  if (opts.max !== undefined && n > opts.max) {
    const err = new Error(`${label} must be <= ${opts.max}`);
    err.code = 'INVALID_INPUT';
    throw err;
  }
  return n;
}

function safeUrl(label, value) {
  if (value === undefined || value === null) return undefined;
  try {
    const u = new URL(String(value));
    return u.toString();
  } catch {
    const err = new Error(`${label} must be a valid URL`);
    err.code = 'INVALID_INPUT';
    throw err;
  }
}

module.exports = {
  isSafeString,
  assertSafeString,
  safeIdentifier,
  safeInt,
  safeUrl
};
