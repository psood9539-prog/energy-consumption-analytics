
module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all fields.'
    });
  }

  // Temporary response to verify that the form reaches the API.
  // Message storage will be configured separately.
  return res.status(200).json({
    success: true,
    message: 'Your message was received successfully.'
  });
};
