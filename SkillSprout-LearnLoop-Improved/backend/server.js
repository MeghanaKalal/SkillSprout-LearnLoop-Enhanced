require('dotenv').config();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('Please set JWT_SECRET in your .env file to a random value of at least 32 characters.');
  process.exit(1);
}
const app = require('./app');
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`SkillSprout is growing at http://localhost:${port}`));
