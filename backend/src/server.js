const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { fallthrough: false }));

app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
