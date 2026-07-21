const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, role, phone, language } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم مسبقاً' });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role,
      phone,
      language
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'تم التسجيل بنجاح',
      user,
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في التسجيل', details: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'الحساب معطل' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      user,
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تسجيل الدخول', details: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب البيانات' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, language } = req.body;
    
    await req.user.update({ fullName, phone, language });
    
    res.json({ message: 'تم تحديث الملف الشخصي', user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في التحديث' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const isPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }

    await req.user.update({ password: newPassword });

    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تغيير كلمة المرور' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب المستخدمين' });
  }
};
