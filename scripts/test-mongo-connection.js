const dotenv = require('dotenv');
const mongoose = require('mongoose');
const dns = require('dns');

dotenv.config({ path: '.env' });

const url = process.env.DATABASE_URL || process.env.MONGODB_URI;
if (!url) {
  console.error('No DATABASE_URL found in .env');
  process.exit(2);
}

console.log(
  'Testing MongoDB connection to:',
  url.startsWith('mongodb+srv://') ? '(SRV) ' + url.split('@')[1] : url
);
mongoose;

// Temporary: force DNS servers for this process to avoid local resolver refusing SRV
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  console.log('Using DNS servers:', dns.getServers());
} catch (e) {
  console.warn('Failed to set DNS servers:', e && e.message);
}

mongoose
  .connect(url, { maxPoolSize: 5 })
  .then(() => {
    console.log('Connected to MongoDB — SUCCESS');
    return mongoose.disconnect();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('MongoDB connection FAILED');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  });
