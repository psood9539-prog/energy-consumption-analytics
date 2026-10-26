const { loadRows, buildData } = require('../server/data');

const rows = loadRows();

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json(
    buildData(rows, req.query || {})
  );
};