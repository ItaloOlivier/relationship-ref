console.log('Starting application...');

try {
  require('./bootstrap');
} catch (error) {
  console.error('Fatal error during startup:', error);
  process.exit(1);
}
