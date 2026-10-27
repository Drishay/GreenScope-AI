import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'analyses.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function createAnalysis(payload) {
  const list = readData();
  const record = {
    ...payload,
    id: crypto.randomUUID(),
    created_date: new Date().toISOString(),
  };
  list.unshift(record);
  writeData(list);
  return record;
}

export function getAnalysisById(id) {
  const list = readData();
  return list.find((item) => String(item.id) === String(id));
}

export function queryAnalyses(opts = {}) {
  const list = readData();
  const sort = opts.sort || '-created_date';
  const limit = typeof opts.limit === 'number' ? opts.limit : 50;

  let sorted = [...list];
  if (sort === '-created_date') {
    sorted.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  } else if (sort === 'created_date') {
    sorted.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }

  return { items: sorted.slice(0, limit) };
}

export function deleteAnalysis(id) {
  const list = readData();
  const filtered = list.filter((item) => String(item.id) !== String(id));
  writeData(filtered);
  return true;
}
