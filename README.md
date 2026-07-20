# نظام متابعة القضايا - Case Tracker

نظام متكامل لمتابعة القضايا القانونية مشابه لبرنامج "صلى الجسم" في الكويت.

## المميزات

- **إدارة القضايا**: إضافة وتعديل وحذف القضايا مع تتبع حالتها
- **تتبع الجلسات**: جدولة ومتابعة جلسات المحكمة
- **إشعارات وتذكيرات**: إشعارات فورية عند تحديث القضايا أو الجلسات
- **تقارير وإحصائيات**: تقارير شاملة عن حالة القضايا
- **بحث وتصفية**: بحث متقدم وتصفية حسب النوع والحالة والأولوية
- **إدارة المستخدمين**: نظام متعدد المستخدمين مع صلاحيات
- **ثنائية اللغة**: دعم العربية والإنجليزية

## التقنيات المستخدمة

### Backend
- Node.js + Express.js
- PostgreSQL (قاعدة بيانات سحابية)
- Sequelize ORM
- JWT للمصادقة

### Frontend
- React.js
- React Router
- Axios للتعامل مع API
- React Icons
- Date-fns للمعاملات التاريخية

## التثبيت والتشغيل

### 1. تثبيت المكتبات

```bash
# تثبيت مكتبات Backend
cd backend
npm install

# تثبيت مكتبات Frontend
cd ../frontend
npm install
```

### 2. إعداد قاعدة البيانات

1. إنشاء قاعدة بيانات PostgreSQL سحابية (مثل Supabase أو Railway)
2. تحديث ملف `.env` في مجلد backend بمعلومات قاعدة البيانات:

```env
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=case_tracker_db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your-super-secret-jwt-key
```

### 3. تشغيل المشروع

```bash
# تشغيل Backend
cd backend
npm run dev

# تشغيل Frontend (في terminal جديد)
cd frontend
npm start
```

### 4. فتح التطبيق

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## هيكل المشروع

```
case-tracker/
├── backend/
│   ├── src/
│   │   ├── config/         # إعدادات قاعدة البيانات
│   │   ├── controllers/    # Controllers
│   │   ├── middleware/      # Middleware
│   │   ├── models/         # نماذج قاعدة البيانات
│   │   ├── routes/         # مسارات API
│   │   └── server.js       # نقطة البداية
│   └── .env                # متغيرات البيئة
└── frontend/
    ├── src/
    │   ├── components/     # المكونات المشتركة
    │   ├── context/        # Context (Auth, Language)
    │   ├── pages/          # صفحات التطبيق
    │   ├── services/       # خدمات API
    │   ├── styles/         # الأنماط CSS
    │   └── utils/          # الأدوات المساعدة
    └── public/
```

## API Endpoints

### المصادقة
- `POST /api/auth/register` - تسجيل حساب جديد
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/profile` - جلب الملف الشخصي

### القضايا
- `GET /api/cases` - جلب جميع القضايا
- `POST /api/cases` - إضافة قضية جديدة
- `GET /api/cases/:id` - جلب تفاصيل القضية
- `PUT /api/cases/:id` - تحديث القضية
- `DELETE /api/cases/:id` - حذف القضية
- `GET /api/cases/stats` - جلب الإحصائيات

### الجلسات
- `GET /api/sessions` - جلب جميع الجلسات
- `POST /api/sessions/case/:caseId` - إضافة جلسة جديدة
- `PUT /api/sessions/:id` - تحديث الجلسة
- `DELETE /api/sessions/:id` - حذف الجلسة

### الإشعارات
- `GET /api/notifications` - جلب الإشعارات
- `PUT /api/notifications/:id/read` - تحديد كمقروء
- `PUT /api/notifications/read-all` - تحديد الكل كمقروء

## ملاحظات

- تأكد من إعداد قاعدة بيانات PostgreSQL قبل تشغيل Backend
- يمكنك استخدام Supabase للحصول على قاعدة بيانات مجانية
- التطبيق يدعم العربية والإنجليزية مع واجهة RTL
