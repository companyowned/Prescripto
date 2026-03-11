const axios = require('axios');
const fs = require('fs');

const instance = axios.create({
  headers: { 'Content-Type': 'application/json' }
});

instance.interceptors.request.use(config => {
  console.log("Config headers:", config.headers);
  return config;
});

const fd = new require('form-data')();
fd.append('foo', 'bar');

instance.post('http://localhost:8000/test', fd).catch(() => { });
