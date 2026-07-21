const sequelize = require('../config/database');
const { User, Client, Case, Session, Invoice, Payment, Transaction, LegalDocument, Notification } = require('../models');

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    // Keep admin users, delete everything else
    console.log('Clearing old data...');
    await Notification.destroy({ where: {} });
    await Payment.destroy({ where: {} });
    await Invoice.destroy({ where: {} });
    await Session.destroy({ where: {} });
    await LegalDocument.destroy({ where: {} });
    await Transaction.destroy({ where: {} });
    await Case.destroy({ where: {} });
    await Client.destroy({ where: {} });
    await User.destroy({ where: { role: { [require('sequelize').Op.ne]: 'admin' } } });
    // Also delete the old lawyer user (id 2,3) to start fresh
    await User.destroy({ where: { id: [2,3,4,5] } });
    console.log('Old data cleared');

    // ===================== USERS =====================
    console.log('Creating users...');
    const users = await User.bulkCreate([
      { username: 'alaa_lawyer', email: 'alaa@firm.kw', password: 'Lawyer@123', fullName: 'علاء عثمان الاحمد', role: 'lawyer', phone: '99887766', language: 'ar' },
      { username: 'noura_lawyer', email: 'noura@firm.kw', password: 'Lawyer@123', fullName: 'نورة عبدالعزيز الصقر', role: 'lawyer', phone: '99776655', language: 'ar' },
      { username: 'fahad_partner', email: 'fahad@firm.kw', password: 'Partner@123', fullName: 'فهد سعود المطيري', role: 'partner', phone: '99665544', language: 'ar' },
      { username: 'yousef_consultant', email: 'yousef@firm.kw', password: 'Consult@123', fullName: 'يوسف أحمد الزعبي', role: 'legal_consultant', phone: '99554433', language: 'ar' },
      { username: 'mona_consultant', email: 'mona@firm.kw', password: 'Consult@123', fullName: 'منى خالد العنزي', role: 'legal_consultant', phone: '99443322', language: 'ar' },
      { username: 'hamad_court', email: 'hamad@firm.kw', password: 'Court@123', fullName: 'حماد ناصر الغانم', role: 'court_agent', phone: '99332211', language: 'ar' },
      { username: 'saleh_tx', email: 'saleh@firm.kw', password: 'Tx@123', fullName: 'صالح عبدالرحمن الخالد', role: 'transactions_agent', phone: '99221100', language: 'ar' },
      { username: 'fatima_secretary', email: 'fatima@firm.kw', password: 'Sec@123', fullName: 'فاطمة محمد الحربي', role: 'legal_secretary', phone: '99110099', language: 'ar' },
      { username: 'khaled_trainee', email: 'khaled@firm.kw', password: 'Train@123', fullName: 'خالد سعد الدوسري', role: 'trainee_lawyer', phone: '99009988', language: 'ar' },
    ]);
    console.log(`Created ${users.length} users`);

    const lawyer1 = users[0]; // alaa
    const lawyer2 = users[1]; // noura
    const partner = users[2]; // fahad
    const consultant1 = users[3]; // yousef
    const consultant2 = users[4]; // mona

    // ===================== CLIENTS =====================
    console.log('Creating clients...');
    const clients = await Client.bulkCreate([
      { name: 'عبدالله يوسف النصر', civilId: '285061501585', phone: '99445566', email: 'abdullah.n@outlook.com', address: 'ال khuwair، شارع 105، بيت 12', nationality: 'كويتي', dateOfBirth: '1985-06-15', firstCooperationDate: '2022-01-10', isActive: true },
      { name: 'مريم أحمد الشمري', civilId: '288032201789', phone: '99334455', email: 'mariam.s@gmail.com', address: 'السالمية، شارع العرب، بيت 45', nationality: 'كويتية', dateOfBirth: '1988-03-22', firstCooperationDate: '2021-05-15', isActive: true },
      { name: 'محمد عبدالرحمن الخوار', civilId: '276051201432', phone: '99223344', email: 'm.khawar@yahoo.com', address: 'الفحيحيل، قطعة 8، شارع 30', nationality: 'كويتي', dateOfBirth: '1976-05-12', firstCooperationDate: '2020-09-20', isActive: true },
      { name: 'سمير جعفر الملا', civilId: '282070801654', phone: '99112233', email: 'samir.malla@hotmail.com', address: 'حولي، شارع الملك فيصل، بيت 78', nationality: 'كويتي', dateOfBirth: '1982-07-08', firstCooperationDate: '2023-02-01', isActive: true },
      { name: 'هدى إبراهيم الرشيدي', civilId: '289011501876', phone: '99887711', email: 'huda.r@outlook.com', address: 'العديلية، شارع 5، بيت 23', nationality: 'كويتية', dateOfBirth: '1990-01-15', firstCooperationDate: '2023-06-10', isActive: true },
      { name: 'يوسف فيصل العتيبي', civilId: '280042001321', phone: '99776600', email: 'yusuf.otaibi@gmail.com', address: 'الروضة، قطعة 12، شارع 8', nationality: 'كويتي', dateOfBirth: '1980-04-20', firstCooperationDate: '2019-11-05', isActive: true },
      { name: 'فاطمة ناصر الصالح', civilId: '286112801543', phone: '99665500', email: 'fatima.s@gmail.com', address: 'الجابرية، شارع الأمير، بيت 91', nationality: 'كويتية', dateOfBirth: '1986-11-28', firstCooperationDate: '2022-08-18', isActive: true },
      { name: 'أحمد خالد الفهد', civilId: '278090301234', phone: '99554400', email: 'ahmed.fahad@outlook.com', address: 'الفنيطيس، شارع 15، بيت 56', nationality: 'كويتي', dateOfBirth: '1978-09-03', firstCooperationDate: '2021-03-22', isActive: true },
      { name: 'نورة سعيد المطيري', civilId: '290050801678', phone: '99443300', email: 'noura.m@hotmail.com', address: 'الفيحاء، قطعة 6، شارع 12', nationality: 'كويتية', dateOfBirth: '1990-05-08', firstCooperationDate: '2024-01-05', isActive: true },
      { name: 'يوسف عبدالعزيز الدوسري', civilId: '275081901987', phone: '99332200', email: 'yusuf.d@gmail.com', address: 'الخيطان، شارع 20، بيت 34', nationality: 'كويتي', dateOfBirth: '1975-08-19', firstCooperationDate: '2020-04-12', isActive: true },
      { name: 'ريم فهد الكندري', civilId: '287021401456', phone: '99221100', email: 'reem.k@outlook.com', address: 'السرة، شارع ابن خلدون، بيت 67', nationality: 'كويتية', dateOfBirth: '1987-02-14', firstCooperationDate: '2023-09-01', isActive: true },
      { name: 'تركي عبدالرحمن العنزي', civilId: '283120501789', phone: '99110000', email: 'turki.a@gmail.com', address: 'العمران، قطعة 15، شارع 7', nationality: 'كويتي', dateOfBirth: '1983-12-05', firstCooperationDate: '2022-11-20', isActive: true },
      { name: 'منال حسن الهاجري', civilId: '291073001321', phone: '99009900', email: 'manal.h@hotmail.com', address: 'اليرموك، شارع 3، بيت 89', nationality: 'كويتية', dateOfBirth: '1991-07-30', firstCooperationDate: '2024-03-15', isActive: true },
      { name: 'бahan محمد الصقر', civilId: '284061601654', phone: '98998877', email: 'ibrahim.s@outlook.com', address: 'الشامية، شارع الخليج، بيت 45', nationality: 'كويتي', dateOfBirth: '1984-06-16', firstCooperationDate: '2021-07-08', isActive: true },
      { name: 'حنان عبدالله الغانم', civilId: '288101201876', phone: '98887766', email: 'hanan.g@gmail.com', address: 'الشعب، قطعة 9، شارع 14', nationality: 'كويتية', dateOfBirth: '1988-10-12', firstCooperationDate: '2023-04-25', isActive: true },
    ]);
    console.log(`Created ${clients.length} clients`);

    // ===================== CASES =====================
    console.log('Creating cases...');
    const cid = (n) => clients[n - 1].id;
    const lid1 = lawyer1.id;
    const lid2 = lawyer2.id;
    const caseData = [
      { caseNumber: '2022-25-0001', title: 'دعوى إيجار شقة سكنية - السالمية', description: 'مطالبة مستأجر بتأجير شقة في حي السالمية مدة 3 سنوات، إيجار شهري 450 د.ك', type: 'civil', status: 'active', priority: 'high', courtType: 'courtOfFirstInstance', court: 'محكمة الأسماء الابتدائية', department: 'القسم المدني', judge: 'القاضي عبدالرحمن الخطيب', opposingParty: 'خالد ناصر العنزي', opposingLawyer: 'م. عبدالعزيز الشمري', clientId: cid(1), assignedLawyerId: lid1, filingDate: '2022-03-15', registrationNumber: '2022/ك ف /1234', consultationFees: 150, litigationFees: 500, sessionFees: 200, otherFees: 50, paymentStatus: 'partial', assignmentDate: '2022-03-10', notes: 'العميل ملتزم بسداد الأجرة الشهرية' },
      { caseNumber: '2022-25-0002', title: 'دعوى تعويض عن حادث مروري', description: 'مطالبة بتعويض عن أضرار حادث مروري في طريق الفحيحيل', type: 'civil', status: 'active', priority: 'medium', courtType: 'courtOfFirstInstance', court: 'محكمة الفحيحيل الابتدائية', department: 'القسم المدني', judge: 'القاضي سعد البكري', opposingParty: 'شركة Jazeera للتأمين', opposingLawyer: 'م. ناصر الدوسري', clientId: cid(2), assignedLawyerId: lid1, filingDate: '2022-06-20', registrationNumber: '2022/ك ف /2345', consultationFees: 200, litigationFees: 800, sessionFees: 300, otherFees: 100, paymentStatus: 'paid', assignmentDate: '2022-06-15' },
      { caseNumber: '2023-25-0003', title: 'قضية طلاق - الأحمدي', description: 'دعوى طلاق تباعع بين الزوجين في الأحمدي', type: 'family', status: 'active', priority: 'urgent', courtType: 'familyCourt', court: 'المحكمة العامة - الأحمدي', department: 'قسم الأحوال الشخصية', judge: 'القاضية فاطمة الحميدي', opposingParty: 'سارة عبدالله الناشف', opposingLawyer: 'م. هند العتيبي', clientId: cid(3), assignedLawyerId: lid2, filingDate: '2023-01-10', registrationNumber: '2023/أ ح /3456', consultationFees: 300, litigationFees: 1000, sessionFees: 400, otherFees: 150, paymentStatus: 'paid', assignmentDate: '2023-01-05', notes: 'جلسة تسوية مرتقبة' },
      { caseNumber: '2023-25-0004', title: 'دعوى استرداد دين - تجاري', description: 'مطالبة بتقديم دين بقيمة 25,000 د.ك من شركة مقاولات', type: 'commercial', status: 'active', priority: 'high', courtType: 'commercialCourt', court: 'المحكمة التجارية', department: 'القسم التجاري', judge: 'القاضي مبارك الخلف', opposingParty: 'شركة الأهرام للمقاولات', opposingLawyer: 'م. فيصل السالم', clientId: cid(4), assignedLawyerId: lid1, filingDate: '2023-02-05', registrationNumber: '2023/تج /4567', consultationFees: 250, litigationFees: 700, sessionFees: 250, otherFees: 75, paymentStatus: 'partial', assignmentDate: '2023-02-01' },
      { caseNumber: '2023-25-0005', title: 'دعوى تعويض عن فصل تعسفي', description: 'مطالبة موظف بتعويض عن فصل تعسفي من شركة الاتصالات', type: 'labor', status: 'won', priority: 'medium', courtType: 'laborCourt', court: 'محكمة العمل', department: 'القسم العمالي', judge: 'القاضي أحمد الجابر', opposingParty: 'شركة اتصالات الكويت', opposingLawyer: 'م. نورا الحمد', clientId: cid(5), assignedLawyerId: lid2, filingDate: '2023-03-15', registrationNumber: '2023/عم /5678', verdict: 'حكم لصالح المدعي بتعويض 12,000 د.ك', verdictDate: '2023-09-20', consultationFees: 100, litigationFees: 600, sessionFees: 200, otherFees: 50, paymentStatus: 'paid', assignmentDate: '2023-03-10', closingDate: '2023-09-20' },
      { caseNumber: '2023-25-0006', title: 'دعوى ملكية أرض - الجهراء', description: 'تثبيت ملكية قطعة أرض في الجهراء', type: 'civil', status: 'active', priority: 'medium', courtType: 'courtOfFirstInstance', court: 'محكمة الجهراء الابتدائية', department: 'القسم العقاري', judge: 'القاضي يوسف البراك', opposingParty: 'هيئة الأوقاف العامة', opposingLawyer: 'هيئة الأوقاف - قانوني', clientId: cid(6), assignedLawyerId: lid1, filingDate: '2023-04-10', registrationNumber: '2023/ك ج /6789', consultationFees: 500, litigationFees: 1500, sessionFees: 500, otherFees: 200, paymentStatus: 'paid', assignmentDate: '2023-04-05' },
      { caseNumber: '2023-25-0007', title: 'دعوى إخلاء شقة - حولي', description: 'طلب إخلاء شقة مستأجرة في حولي بعد انتهاء العقد', type: 'civil', status: 'settled', priority: 'low', courtType: 'courtOfFirstInstance', court: 'محكمة حولي الابتدائية', department: 'القسم المدني', judge: 'القاضي خالد المطيري', opposingParty: 'عبدالرحمن يوسف الهاجري', opposingLawyer: 'م. سعيد المرزوق', clientId: cid(7), assignedLawyerId: lid2, filingDate: '2023-05-20', registrationNumber: '2023/ك ح /7890', consultationFees: 100, litigationFees: 350, sessionFees: 150, otherFees: 30, paymentStatus: 'paid', assignmentDate: '2023-05-15', closingDate: '2023-08-15', verdict: 'تم التسوية خارج المحكمة' },
      { caseNumber: '2023-25-0008', title: 'دعوى تعويض عن خدش سمعة', description: 'مطالبة بتعويض عن إشاعةThrough social media', type: 'civil', status: 'active', priority: 'high', courtType: 'courtOfFirstInstance', court: 'محكمة الأسماء الابتدائية', department: 'القسم المدني', judge: 'القاضي عبدالرحمن الخطيب', opposingParty: 'منشورات الديجيتال', opposingLawyer: 'م. فيصل الجاسر', clientId: cid(8), assignedLawyerId: lid1, filingDate: '2023-06-15', registrationNumber: '2023/ك ف /8901', consultationFees: 200, litigationFees: 900, sessionFees: 350, otherFees: 100, paymentStatus: 'partial', assignmentDate: '2023-06-10' },
      { caseNumber: '2024-25-0009', title: 'قضية إرث - توزيع تركه', description: 'توزيع تركه متوفى بين الورثة - 5 أشخاص', type: 'family', status: 'active', priority: 'medium', courtType: 'familyCourt', court: 'المحكمة العامة - العاصمة', department: 'قسم الإرث', judge: 'القاضية نورة الماجد', opposingParty: 'أحمد وسعد ونورة (ورثة آخرون)', opposingLawyer: 'م. حمد النعيمي', clientId: cid(9), assignedLawyerId: lid2, filingDate: '2024-01-08', registrationNumber: '2024/أ ع /9012', consultationFees: 400, litigationFees: 1200, sessionFees: 500, otherFees: 150, paymentStatus: 'paid', assignmentDate: '2024-01-03' },
      { caseNumber: '2024-25-0010', title: 'دعوى تعويض عن عيوب البناء', description: 'مطالبة مقاول بتعويض عن عيوب في بناء فيلا', type: 'civil', status: 'active', priority: 'high', courtType: 'courtOfFirstInstance', court: 'محكمة المباركية الابتدائية', department: 'القسم المدني', judge: 'القاضي مبارك الهرمي', opposingParty: 'مقاولات الخليج', opposingLawyer: 'م. عبدالعزيز الصقر', clientId: cid(10), assignedLawyerId: lid1, filingDate: '2024-02-12', registrationNumber: '2024/ك م /0123', consultationFees: 300, litigationFees: 1000, sessionFees: 400, otherFees: 100, paymentStatus: 'partial', assignmentDate: '2024-02-07' },
      { caseNumber: '2024-25-0011', title: 'دعوى نفقة أطفال', description: 'مطالبة بنفقة أطفال بعد الطلاق', type: 'family', status: 'active', priority: 'urgent', courtType: 'familyCourt', court: 'المحكمة العامة - السالمية', department: 'قسم الأحوال الشخصية', judge: 'القاضية فاطمة الحميدي', opposingParty: 'فهد يوسف العتيبي', opposingLawyer: 'م. ليلى الدوسري', clientId: cid(11), assignedLawyerId: lid2, filingDate: '2024-03-05', registrationNumber: '2024/أ س /1234', consultationFees: 200, litigationFees: 700, sessionFees: 300, otherFees: 75, paymentStatus: 'paid', assignmentDate: '2024-03-01' },
      { caseNumber: '2024-25-0012', title: 'دعوى إيجار تجاري - شارع الخليج', description: 'إيجار محل تجاري في شارع الخليج - إيجار سنوي', type: 'commercial', status: 'active', priority: 'medium', courtType: 'commercialCourt', court: 'المحكمة التجارية', department: 'القسم التجاري', judge: 'القاضي مبارك الخلف', opposingParty: 'شركة المدار التجاري', opposingLawyer: 'م. أحمد المنصور', clientId: cid(12), assignedLawyerId: lid1, filingDate: '2024-04-10', registrationNumber: '2024/تج /2345', consultationFees: 250, litigationFees: 800, sessionFees: 300, otherFees: 80, paymentStatus: 'unpaid', assignmentDate: '2024-04-05' },
      { caseNumber: '2024-25-0013', title: 'دعوى حماية ملكية فكرية', description: 'حماية علامة تجارية مسجلة في الكويت', type: 'commercial', status: 'pending', priority: 'high', courtType: 'commercialCourt', court: 'المحكمة التجارية', department: 'قسم الملكية الفكرية', judge: 'القاضي سالم الجهني', opposingParty: 'شركة الأمل للتجارة', opposingLawyer: 'م. ريم الصباح', clientId: cid(13), assignedLawyerId: lid2, filingDate: '2024-05-18', registrationNumber: '2024/تج /3456', consultationFees: 500, litigationFees: 1500, sessionFees: 600, otherFees: 200, paymentStatus: 'paid', assignmentDate: '2024-05-13' },
      { caseNumber: '2024-25-0014', title: 'دعوى إيجار مخزن صناعي', description: 'إيجار مخزن في المنطقة الصناعية بالصباح', type: 'commercial', status: 'active', priority: 'low', courtType: 'commercialCourt', court: 'المحكمة التجارية', department: 'القسم التجاري', judge: 'القاضي مبارك الخلف', opposingParty: 'شركة البناء الحديث', opposingLawyer: 'م. خالد الفارسي', clientId: cid(14), assignedLawyerId: lid1, filingDate: '2024-06-22', registrationNumber: '2024/تج /4567', consultationFees: 200, litigationFees: 600, sessionFees: 200, otherFees: 50, paymentStatus: 'paid', assignmentDate: '2024-06-17' },
      { caseNumber: '2024-25-0015', title: 'دعوى تعويض عن حريق منزلي', description: 'مطالبة شركة كهرباء بتعويض عن حريق بسبب عطل كهربائي', type: 'civil', status: 'active', priority: 'high', courtType: 'courtOfFirstInstance', court: 'محكمة الجهراء الابتدائية', department: 'القسم المدني', judge: 'القاضي يوسف البراك', opposingParty: 'شركة كهرباء الكويت', opposingLawyer: 'م. عبدالله الرشيدي', clientId: cid(15), assignedLawyerId: lid2, filingDate: '2024-07-15', registrationNumber: '2024/ك ج /5678', consultationFees: 250, litigationFees: 900, sessionFees: 350, otherFees: 100, paymentStatus: 'partial', assignmentDate: '2024-07-10' },
      { caseNumber: '2022-25-0016', title: 'دعوى تأمين صحي - رفض CLAIM', description: 'مطالبة شركة تأمين بسداد تكاليف علاج', type: 'civil', status: 'won', priority: 'medium', courtType: 'courtOfFirstInstance', court: 'محكمة السالمية الابتدائية', department: 'القسم المدني', judge: 'القاضي عبدالرحمن الخطيب', opposingParty: 'شركة بريمير للتأمين', opposingLawyer: 'م. نورة العتيبي', clientId: cid(1), assignedLawyerId: lid2, filingDate: '2022-08-10', registrationNumber: '2022/ك س /6789', verdict: 'حكم لصالح المدعي - تعويض 8,500 د.ك', verdictDate: '2023-02-28', consultationFees: 150, litigationFees: 500, sessionFees: 200, otherFees: 50, paymentStatus: 'paid', assignmentDate: '2022-08-05', closingDate: '2023-02-28' },
      { caseNumber: '2023-25-0017', title: 'دعوى فسخ عقد بيع', description: 'طلب فسخ عقد بيع سيارة بسبب عيوب خفية', type: 'civil', status: 'closed', priority: 'low', courtType: 'courtOfFirstInstance', court: 'محكمة حولي الابتدائية', department: 'القسم المدني', judge: 'القاضي خالد المطيري', opposingParty: 'Saleh المحمدي', opposingLawyer: 'م. سعيد المرزوق', clientId: cid(4), assignedLawyerId: lid1, filingDate: '2023-07-01', registrationNumber: '2023/ك ح /7891', verdict: 'تم الفسخ بالاتفاق', verdictDate: '2023-10-15', consultationFees: 100, litigationFees: 300, sessionFees: 100, otherFees: 30, paymentStatus: 'paid', assignmentDate: '2023-06-26', closingDate: '2023-10-15' },
      { caseNumber: '2024-25-0018', title: 'دعوى مكافأة نهاية خدمة', description: 'مطالبة موظف بمكافأة نهاية خدمة بعد 15 سنة', type: 'labor', status: 'active', priority: 'medium', courtType: 'laborCourt', court: 'محكمة العمل', department: 'القسم العمالي', judge: 'القاضي أحمد الجابر', opposingParty: 'شركة البترول الكويتية', opposingLawyer: 'م. فيصل الجاسر', clientId: cid(6), assignedLawyerId: lid2, filingDate: '2024-08-05', registrationNumber: '2024/عم /8901', consultationFees: 200, litigationFees: 700, sessionFees: 250, otherFees: 75, paymentStatus: 'unpaid', assignmentDate: '2024-08-01' },
      { caseNumber: '2024-25-0019', title: 'دعوى حق انتفاع - مبنى تجاري', description: 'مطالبة بحق انتفاع في مبنى تجاري في شارع الملك فيصل', type: 'civil', status: 'active', priority: 'high', courtType: 'courtOfFirstInstance', court: 'محكمة العاصمة الابتدائية', department: 'القسم العقاري', judge: 'القاضي مبارك الهرمي', opposingParty: 'Groupe Immobilier', opposingLawyer: 'م. ريم الصباح', clientId: cid(7), assignedLawyerId: lid1, filingDate: '2024-09-12', registrationNumber: '2024/ك ع /9012', consultationFees: 400, litigationFees: 1200, sessionFees: 500, otherFees: 150, paymentStatus: 'partial', assignmentDate: '2024-09-07' },
      { caseNumber: '2024-25-0020', title: 'دعوى إيجار شقة - الفحيحيل', description: 'تجديد عقد إيجار شقة سكنية في الفحيحيل', type: 'civil', status: 'pending', priority: 'low', courtType: 'courtOfFirstInstance', court: 'محكمة الفحيحيل الابتدائية', department: 'القسم المدني', judge: 'القاضي سعد البكري', opposingParty: 'أحمد عبدالعزيز السالم', opposingLawyer: 'م. ناصر الدوسري', clientId: cid(8), assignedLawyerId: lid2, filingDate: '2024-10-01', registrationNumber: '2024/ك ف /0123', consultationFees: 100, litigationFees: 350, sessionFees: 150, otherFees: 30, paymentStatus: 'paid', assignmentDate: '2024-09-26' },
      { caseNumber: '2025-25-0021', title: 'دعوى تعويض عن تأخر بناء', description: 'مطالبة مقاول بتعويض عن تأخر 6 أشهر في تسليم فيلا', type: 'civil', status: 'active', priority: 'high', courtType: 'courtOfFirstInstance', court: 'محكمة الأحمدي الابتدائية', department: 'القسم المدني', judge: 'القاضي خالد العتيبي', opposingParty: 'مقاولات الأحمدية', opposingLawyer: 'م. سالم الجابر', clientId: cid(10), assignedLawyerId: lid1, filingDate: '2025-01-15', registrationNumber: '2025/ك أ /1234', consultationFees: 300, litigationFees: 900, sessionFees: 350, otherFees: 100, paymentStatus: 'paid', assignmentDate: '2025-01-10' },
      { caseNumber: '2025-25-0022', title: 'دعوى نفقة زوجة', description: 'مطالبة بنفقة زوجة وأطفال بعد الفصل', type: 'family', status: 'active', priority: 'urgent', courtType: 'familyCourt', court: 'المحكمة العامة - الفروانية', department: 'قسم الأحوال الشخصية', judge: 'القاضية نورة الماجد', opposingParty: 'محمد عبدالله العمير', opposingLawyer: 'م. هند العتيبي', clientId: cid(11), assignedLawyerId: lid2, filingDate: '2025-02-20', registrationNumber: '2025/أ ف /2345', consultationFees: 250, litigationFees: 800, sessionFees: 300, otherFees: 80, paymentStatus: 'partial', assignmentDate: '2025-02-15' },
      { caseNumber: '2025-25-0023', title: 'دعوى ضمان تجاري', description: 'مطالبة بضمان من البائع بعد اكتشاف عيوب في بضاعة مستوردة', type: 'commercial', status: 'active', priority: 'medium', courtType: 'commercialCourt', court: 'المحكمة التجارية', department: 'القسم التجاري', judge: 'القاضي سالم الجهني', opposingParty: 'شركة国际贸易', opposingLawyer: 'م. أحمد المنصور', clientId: cid(12), assignedLawyerId: lid1, filingDate: '2025-03-10', registrationNumber: '2025/تج /3456', consultationFees: 350, litigationFees: 1100, sessionFees: 400, otherFees: 120, paymentStatus: 'unpaid', assignmentDate: '2025-03-05' },
      { caseNumber: '2025-25-0024', title: 'دعوى تعويض عن إخلال بالبيئة', description: 'مطالبة بتضرر من صناعة مجاورة', type: 'administrative', status: 'pending', priority: 'high', courtType: 'administrativeCourt', court: 'المحكمة الإدارية', department: 'قسم القضاء الإداري', judge: 'القاضي عبدالعزيز الدوسري', opposingParty: 'الهيئة العامة للبيئة', opposingLawyer: 'م. عبدالله الرشيدي', clientId: cid(13), assignedLawyerId: lid2, filingDate: '2025-04-05', registrationNumber: '2025/إ د /4567', consultationFees: 400, litigationFees: 1300, sessionFees: 500, otherFees: 180, paymentStatus: 'paid', assignmentDate: '2025-04-01' },
      { caseNumber: '2025-25-0025', title: 'دعوى إيجار محل تجاري - المباركية', description: 'إيجار محل تجاري في المباركية - خلاف حول تجديد العقد', type: 'commercial', status: 'active', priority: 'medium', courtType: 'commercialCourt', court: 'المحكمة التجارية', department: 'القسم التجاري', judge: 'القاضي مبارك الخلف', opposingParty: 'هشام النصر', opposingLawyer: 'م. ليلى الدوسري', clientId: cid(14), assignedLawyerId: lid1, filingDate: '2025-05-12', registrationNumber: '2025/تج /5678', consultationFees: 200, litigationFees: 650, sessionFees: 250, otherFees: 60, paymentStatus: 'partial', assignmentDate: '2025-05-07' },
      { caseNumber: '2025-25-0026', title: 'دعوى حضانة أطفال', description: 'نزاع على حضانة طفلين بعد طلاق', type: 'family', status: 'active', priority: 'urgent', courtType: 'familyCourt', court: 'المحكمة العامة - العاصمة', department: 'قسم الأحوال الشخصية', judge: 'القاضية فاطمة الحميدي', opposingParty: 'رائد عبدالله الصقر', opposingLawyer: 'م. نورة العتيبي', clientId: cid(15), assignedLawyerId: lid2, filingDate: '2025-06-01', registrationNumber: '2025/أ ع /6789', consultationFees: 300, litigationFees: 900, sessionFees: 400, otherFees: 100, paymentStatus: 'paid', assignmentDate: '2025-05-27' },
      { caseNumber: '2025-25-0027', title: 'دعوى تعويض عن وفاة عامل', description: 'مطالبة بتعويض من شركة بسبب وفاة عامل في موقع عمل', type: 'labor', status: 'active', priority: 'urgent', courtType: 'laborCourt', court: 'محكمة العمل', department: 'القسم العمالي', judge: 'القاضي أحمد الجابر', opposingParty: 'شركة البناء الحديثة', opposingLawyer: 'م. فيصل الجاسر', clientId: cid(1), assignedLawyerId: lid1, filingDate: '2025-07-10', registrationNumber: '2025/عم /7890', consultationFees: 500, litigationFees: 2000, sessionFees: 800, otherFees: 300, paymentStatus: 'partial', assignmentDate: '2025-07-05' },
      { caseNumber: '2025-25-0028', title: 'دعوى توثيق عقد إجارة', description: 'توثيق عقد إجارة سكنية أمام القضاء', type: 'civil', status: 'pending', priority: 'low', courtType: 'courtOfFirstInstance', court: 'محكمة السالمية الابتدائية', department: 'القسم المدني', judge: 'القاضي خالد المطيري', opposingParty: 'المالك - عبدالله الحربي', opposingLawyer: 'بدون', clientId: cid(3), assignedLawyerId: lid1, filingDate: '2025-08-01', registrationNumber: '2025/ك س /8901', consultationFees: 80, litigationFees: 200, sessionFees: 80, otherFees: 20, paymentStatus: 'unpaid', assignmentDate: '2025-07-27' },
      { caseNumber: '2025-25-0029', title: 'دعوى مطالبة بفواتير مياه', description: 'طعن في فواتير مياه عالية بشكل غير مبرر', type: 'administrative', status: 'active', priority: 'medium', courtType: 'administrativeCourt', court: 'المحكمة الإدارية', department: 'قسم القضاء الإداري', judge: 'القاضي عبدالعزيز الدوسري', opposingParty: 'هيئة المياه الكويتية', opposingLawyer: 'م. عبدالله الرشيدي', clientId: cid(9), assignedLawyerId: lid2, filingDate: '2025-09-05', registrationNumber: '2025/إ د /9012', consultationFees: 150, litigationFees: 500, sessionFees: 200, otherFees: 50, paymentStatus: 'paid', assignmentDate: '2025-09-01' },
      { caseNumber: '2025-25-0030', title: 'دعوى تعويض عن تلوث مياه', description: 'مطالبة مجموعة مقيمين بتعويض بسبب تلوث شبكة المياه', type: 'civil', status: 'active', priority: 'high', courtType: 'courtOfFirstInstance', court: 'محكمة الفروانية الابتدائية', department: 'القسم المدني', judge: 'القاضي يوسف البراك', opposingParty: 'شركة المياه المالحة', opposingLawyer: 'م. سعيد المرزوق', clientId: cid(4), assignedLawyerId: lid1, filingDate: '2025-10-10', registrationNumber: '2025/ك ف /0123', consultationFees: 200, litigationFees: 700, sessionFees: 250, otherFees: 70, paymentStatus: 'partial', assignmentDate: '2025-10-05', notes: 'تجمع لعدة أطراف — يحتاج تنسيق' },
    ];

    const cases = await Case.bulkCreate(caseData);
    console.log(`Created ${cases.length} cases`);

    // ===================== SESSIONS =====================
    console.log('Creating sessions...');
    const sessionData = [];
    let sessionCounter = 1;
    const statuses = ['scheduled', 'completed', 'postponed', 'scheduled', 'completed', 'scheduled', 'completed', 'postponed', 'scheduled', 'completed'];
    const locations = ['المحكمة الابتدائية - قاعة 5', 'المحكمة التجارية - قاعة 3', 'المحكمة الإدارية - قاعة 7', 'محكمة العمل - قاعة 2', 'المحكمة العامة - قاعة 10', 'محكمة الأسماء - قاعة 4'];
    const times = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];

    for (let i = 0; i < 40; i++) {
      const caseIdx = i % cases.length;
      const c = cases[caseIdx];
      const status = statuses[i % statuses.length];
      const monthOffset = Math.floor(i / 4);
      const day = 1 + (i % 28);
      const month = 1 + monthOffset;
      const year = month > 12 ? 2025 : 2024;
      const actualMonth = month > 12 ? month - 12 : month;

      sessionData.push({
        caseId: c.id,
        sessionNumber: Math.floor(i / cases.length) + 1,
        sessionType: i % 3 === 0 ? 'mainSession' : i % 3 === 1 ? 'subSession' : 'consultation',
        date: `${year}-${String(actualMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
        time: times[i % times.length],
        location: locations[i % locations.length],
        status: status,
        postponedTo: status === 'postponed' ? `${year}-${String(actualMonth + 1 > 12 ? 1 : actualMonth + 1).padStart(2,'0')}-${String(Math.min(day + 15, 28)).padStart(2,'0')}` : null,
        outcome: status === 'completed' ? 'تمت الم聆اة وتأجل النطق بالحكم' : status === 'postponed' ? 'تأجيل لتقديم مرافعة إضافية' : null,
      });
    }

    const sessions = await Session.bulkCreate(sessionData);
    console.log(`Created ${sessions.length} sessions`);

    // ===================== INVOICES =====================
    console.log('Creating invoices...');
    const invoiceData = [];
    const invStatuses = ['paid', 'pending', 'overdue', 'paid', 'paid', 'pending', 'paid', 'paid', 'pending', 'overdue'];
    const invTypes = ['consultation', 'case_fees', 'court_fees', 'document_fees', 'other', 'case_fees'];

    for (let i = 0; i < 25; i++) {
      const c = cases[i % cases.length];
      const total = parseFloat(c.consultationFees || 0) + parseFloat(c.litigationFees || 0) + parseFloat(c.sessionFees || 0) + parseFloat(c.otherFees || 0);
      const status = invStatuses[i % invStatuses.length];
      const paid = status === 'paid' ? total : status === 'pending' ? total * 0.5 : 0;
      const invNum = `INV-2025-${String(i + 1).padStart(4, '0')}`;

      invoiceData.push({
        invoiceNumber: invNum,
        clientId: c.clientId,
        caseId: c.id,
        type: invTypes[i % invTypes.length],
        status: status,
        totalAmount: total,
        paidAmount: paid,
        taxRate: 0,
        taxAmount: 0,
        discount: 0,
        issuedDate: `2025-${String(1 + (i % 12)).padStart(2,'0')}-${String(1 + (i % 28)).padStart(2,'0')}`,
        dueDate: `2025-${String(1 + (i % 12) + 1 > 12 ? 12 : 1 + (i % 12) + 1).padStart(2,'0')}-${String(1 + (i % 28)).padStart(2,'0')}`,
        notes: i % 3 === 0 ? 'فاتورة استشارة أولية' : i % 3 === 1 ? 'أتعاب الترافع' : 'رسوم الجلسات',
      });
    }

    const invoices = await Invoice.bulkCreate(invoiceData);
    console.log(`Created ${invoices.length} invoices`);

    // ===================== TRANSACTIONS =====================
    console.log('Creating transactions...');
    const txData = [
      { title: 'استخراج صك عقاري - السالمية', governmentEntity: 'إدارة الأراضي - السالمية', entityType: 'ministry_of_justice', status: 'completed', submissionDate: '2025-01-15', expectedDate: '2025-02-15', completionDate: '2025-02-10', caseId: cases[0].id, clientId: clients[0].id },
      { title: 'شهادة إثبات وفاة', governmentEntity: 'الإدارة الصحية', entityType: 'other', status: 'completed', submissionDate: '2025-02-01', expectedDate: '2025-02-20', completionDate: '2025-02-18', clientId: clients[8].id },
      { title: 'طلب تأشيرة سفر', governmentEntity: 'السفارة الأمريكية - الكويت', entityType: 'embassy', status: 'processing', submissionDate: '2025-03-10', expectedDate: '2025-04-10', caseId: cases[3].id, clientId: clients[3].id },
      { title: 'توثيق توكيل رسمي', governmentEntity: 'الإدارة العامة للمستندات', entityType: 'ministry_of_justice', status: 'completed', submissionDate: '2025-04-05', expectedDate: '2025-04-20', completionDate: '2025-04-15', clientId: clients[5].id },
      { title: 'استخراج سجل تجاري', governmentEntity: 'الهيئة العامة للمعلومات', entityType: 'general_sec', status: 'processing', submissionDate: '2025-05-12', expectedDate: '2025-06-12', clientId: clients[11].id },
      { title: 'طلب إقامة قانونية', governmentEntity: 'جهاز الأحداث - الكويت', entityType: 'other', status: 'pending', submissionDate: '2025-06-01', expectedDate: '2025-07-01', clientId: clients[2].id },
      { title: 'استخراج شهادة ميلاد', governmentEntity: 'الإقامة العامة', entityType: 'paci', status: 'completed', submissionDate: '2025-07-15', expectedDate: '2025-08-01', completionDate: '2025-07-28', clientId: clients[10].id },
      { title: 'تجديد إقامة', governmentEntity: 'جهاز الأحداث - الكويت', entityType: 'paci', status: 'processing', submissionDate: '2025-08-20', expectedDate: '2025-09-20', clientId: clients[4].id },
      { title: 'طلب تأشيرة عربية', governmentEntity: 'السفارة السعودية - الكويت', entityType: 'embassy', status: 'submitted', submissionDate: '2025-09-10', expectedDate: '2025-10-10', clientId: clients[7].id },
      { title: 'شهادة خلو سوابق', governmentEntity: 'الإدارة العامة للمستندات', entityType: 'ministry_of_justice', status: 'completed', submissionDate: '2025-10-05', expectedDate: '2025-10-25', completionDate: '2025-10-20', clientId: clients[1].id },
      { title: 'تسجيل علامة تجارية', governmentEntity: 'الإدارة العامة للمستندات', entityType: 'ministry_of_justice', status: 'pending', submissionDate: '2025-11-01', expectedDate: '2025-12-01', clientId: clients[12].id },
      { title: 'استخراج تقرير طبي', governmentEntity: 'المستشفى العام - الكويت', entityType: 'other', status: 'completed', submissionDate: '2025-11-15', expectedDate: '2025-12-01', completionDate: '2025-11-28', clientId: clients[14].id },
    ];
    const txns = await Transaction.bulkCreate(txData.map(t => ({ ...t, createdBy: 1 })));
    console.log(`Created ${txns.length} transactions`);

    // ===================== LEGAL DOCUMENTS =====================
    console.log('Creating legal documents...');
    const docData = [
      { caseId: cases[0].id, title: 'عقد إيجار شقة السالمية', type: 'contract', status: 'approved', content: 'بسم الله الرحمن الرحيم\n\nعقد إيجار سكني\n\nبين الطرف الأول: عبدالله يوسف النصر\nوالطرف الثاني: خالد ناصر العنزي\n\nموضوع العقد: تأجير شقة في حي السالمية\nقيمة الإيجار: 450 د.ك شهرياً\nمدة العقد: 3 سنوات\n\nتوقيع الطرف الأول: ___\nتوقيع الطرف الثاني: ___', uploadedBy: lawyer1.id, reviewDate: '2022-03-10', approvalDate: '2022-03-12' },
      { caseId: cases[1].id, title: 'مذكرة دفاع - حادث مروري', type: 'memo', status: 'approved', content: 'بسم الله الرحمن الرحيم\n\nمذكرة دفاع\n\nرقم القضية: 2022/ك ف /2345\n\nأولاً: الوقائع\nوقع الحادث في طريق الفحيحيل\n\nثانياً: أسباب الطعن\nعدم كفاية الأدلة\n\nثالثاً: الدفع القانوني\nالمواد 678-690 من القانون المدني', uploadedBy: lawyer1.id, reviewDate: '2022-06-25', approvalDate: '2022-06-28' },
      { caseId: cases[2].id, title: 'طلب طلاق - المحكمة العامة', type: 'petition', status: 'approved', content: 'بسم الله الرحمن الرحيم\n\nإلى السيد/ قاضي المحكمة العامة\n\nالتماس بطلب طلاق تباعع\n\nالأطراف: م. محمد عبدالرحمن الخوار\nالطرف المقابل: سارة عبدالله الناشف', uploadedBy: lawyer2.id, reviewDate: '2023-01-12', approvalDate: '2023-01-14' },
      { caseId: cases[4].id, title: 'حكم تعويض - فصل تعسفي', type: 'judgment', status: 'archived', content: 'بسم الله الرحمن الرحيم\n\nحكم قضائي\n\nرقم: 2023/عم /5678\n\nحكمت المحكمة بتعويض المدعي بقيمة 12,000 د.ك', uploadedBy: lawyer2.id },
      { caseId: cases[5].id, title: 'عقد بيع أرض - الجهراء', type: 'contract', status: 'under_review', content: 'بسم الله الرحمن الرحيم\n\nعقد بيع قطعة أرض\n\nالبائع: يوسف فيصل العتيبي\nالمشتري: هيئة الأوقاف العامة\n\nالمساحة: 500 متر مربع\nالقيمة: 120,000 د.ك', uploadedBy: lawyer1.id, reviewDate: '2023-04-15' },
      { caseId: cases[7].id, title: 'استشارة قانونية - حماية السمعة', type: 'memo', status: 'approved', content: 'بسم الله الرحمن الرحيم\n\nالاستشارة القانونية\n\nموضوع: حماية السمعة عبر الإنترنت\n\nالرأي القانوني: يمكن المطالبة بتعويض وفقاً للمواد 170-174 من القانون المدني', uploadedBy: consultant1.id, reviewDate: '2023-06-20', approvalDate: '2023-06-22' },
      { caseId: cases[9].id, title: 'تقرير خبير - عيوب البناء', type: 'other', status: 'under_review', content: 'تقرير خبير فني\n\nموضوع: معاينة عيوب البناء في الفيلا\n\nالعيوب المكتشفة:\n1. تشققات في الجدران\n2. تسريب مياه\n3. عطل كهربائي\n\nالتكلفة التقديرية: 15,000 د.ك', uploadedBy: lawyer1.id, reviewDate: '2024-02-20' },
      { caseId: cases[12].id, title: 'عقد ترخيص علامة تجارية', type: 'contract', status: 'draft', content: 'عقد ترخيص استخدام علامة تجارية\n\nالترخيص: شركة الأمل للتجارة\nالعلامة: ___\nالمدة: 5 سنوات\nقيمة الترخيص: 10,000 د.ك سنوياً', uploadedBy: lawyer2.id },
    ];
    const docs = await LegalDocument.bulkCreate(docData);
    console.log(`Created ${docs.length} documents`);

    console.log('\n✅ All demo data imported successfully!');
    console.log(`   Users: ${users.length + 1} (including admin)`);
    console.log(`   Clients: ${clients.length}`);
    console.log(`   Cases: ${cases.length}`);
    console.log(`   Sessions: ${sessions.length}`);
    console.log(`   Invoices: ${invoices.length}`);
    console.log(`   Transactions: ${txns.length}`);
    console.log(`   Documents: ${docs.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

run();
