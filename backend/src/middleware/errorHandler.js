const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => e.message);
    return res.status(400).json({ error: 'خطأ في التحقق', details: errors });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ error: 'البيانات موجودة مسبقاً' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'رمز غير صالح' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'انتهت صلاحية الرمز' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'خطأ داخلي في الخادم'
  });
};

module.exports = errorHandler;
