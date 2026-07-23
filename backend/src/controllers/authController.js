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

exports.getUserList = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'role']
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب المستخدمين', details: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب المستخدمين', details: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role, phone, language } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب ملؤها' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم مسبقاً' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: 'اسم المستخدم مستخدم مسبقاً' });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: role || 'lawyer',
      phone: phone || null,
      language: language || 'ar'
    });

    res.status(201).json({ message: 'تم إنشاء المستخدم بنجاح', user });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في إنشاء المستخدم', details: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const { fullName, role, phone, isActive, language } = req.body;

    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (role !== undefined) updates.role = role;
    if (phone !== undefined) updates.phone = phone;
    if (isActive !== undefined) updates.isActive = isActive;
    if (language !== undefined) updates.language = language;

    await user.update(updates);

    res.json({ message: 'تم تحديث المستخدم بنجاح', user });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث المستخدم', details: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    await user.update({ password: newPassword });

    res.json({ message: 'تم إعادة تعيين كلمة المرور بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في إعادة تعيين كلمة المرور', details: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'لا يمكن حذف مدير النظام' });
    }

    if (user.id === req.user.id) {
      return res.status(403).json({ error: 'لا يمكنك حذف حسابك الخاص' });
    }

    await user.update({ isActive: false });

    res.json({ message: 'تم تعطيل المستخدم بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف المستخدم', details: error.message });
  }
};
