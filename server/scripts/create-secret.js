const speakeasy = require('speakeasy');
const fs = require('fs');
const path = require('path');

function generate2FA() {
  const length = Math.floor(Math.random() * 51) + 100;

  const secret = speakeasy.generateSecret({
    length,
    name: `App`
  });

  return secret.base32;
}

function updateEnv(key, value) {
  const envPath = path.join(__dirname, '..', '.env'); // adjust if needed
  let env = '';

  if (fs.existsSync(envPath)) {
    env = fs.readFileSync(envPath, 'utf8');
  }

  const regex = new RegExp(`^${key}=.*$`, 'm');

  if (regex.test(env)) {
    env = env.replace(regex, `${key}=${value}`);
  } else {
    env += `\n${key}=${value}`;
  }

  fs.writeFileSync(envPath, env.trim() + '\n');
}

const secret = generate2FA();

updateEnv('AUTH_SECRET', secret);

console.log('New AUTH_SECRET saved:', secret);