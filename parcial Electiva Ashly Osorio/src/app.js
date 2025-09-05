import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/', express.static(path.join(__dirname, 'views')));

const DATA_DIR = path.join(__dirname, 'data');
const DEPTS_FILE = path.join(DATA_DIR, 'departments.json');
const TOWNS_FILE = path.join(DATA_DIR, 'towns.json');
const RECORDS_FILE = path.join(DATA_DIR, 'registros.json');

app.get('/api/departments', async (req, res) => {
  try {
    const txt = await fs.readFile(DEPTS_FILE, 'utf-8');
    const data = JSON.parse(txt);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error reading departments' });
  }
});

app.get('/api/towns', async (req, res) => {
  try {
    const txt = await fs.readFile(TOWNS_FILE, 'utf-8');
    const data = JSON.parse(txt);
    const { department } = req.query;
    if (department) {
      const filtered = data.filter(t => t.department === department);
      res.json(filtered);
    } else {
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: 'Error reading towns' });
  }
});

app.get('/api/records', async (req, res) => {
  try {
    const txt = await fs.readFile(RECORDS_FILE, 'utf-8');
    const data = JSON.parse(txt);
    
    const { departamento, municipio } = req.query;
    let result = data;
    if (departamento) result = result.filter(r => r.departamento === departamento);
    if (municipio) result = result.filter(r => r.municipio === municipio);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error reading records' });
  }
});

app.post('/api/records', async (req, res) => {
  try {
    const { fecha, departamento, municipio } = req.body;
    if (!fecha || !departamento || !municipio) {
      return res.status(400).json({ error: 'falta fecha, departamento o municipio' });
    }
    const txt = await fs.readFile(RECORDS_FILE, 'utf-8');
    const data = JSON.parse(txt);
    const newRecord = { id: Date.now().toString(), fecha, departamento, municipio };
    data.push(newRecord);
    await fs.writeFile(RECORDS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    res.status(201).json(newRecord);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving record' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', date: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
