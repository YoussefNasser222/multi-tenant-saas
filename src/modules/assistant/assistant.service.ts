import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

// خريطة الصفحات الموجودة فعليًا في الموقع، مقسّمة حسب حالة الدخول، عشان الموديل
// ميخترعش روابط مش موجودة. أي صفحة تتضاف/تتشال في الفرونت لازم تتحدّث هنا كمان.
const PUBLIC_ROUTES = `
- / : الصفحة الرئيسية
- /clinics : تصفح كل العيادات والحجز
- /clinics/:id : تفاصيل عيادة معيّنة وحجز موعد فيها (لازم id حقيقي، ولو معندناش رقم العيادة رجّع /clinics بدل ما تخترع id)
- /login : تسجيل دخول (دكتور/مريض/مستشفى)
- /admin-login : تسجيل دخول الأدمن
- /register : إنشاء حساب جديد (مريض/دكتور/مستشفى)
- /forgot-password : نسيت كلمة المرور
- /emergency-report : الإبلاغ عن حالة طوارئ (بدون تسجيل دخول)
- /emergency-track : متابعة حالة طوارئ بالكود
`;

const PATIENT_ROUTES = `
- /patient : الرئيسية بعد الدخول
- /patient/appointments : مواعيدي
- /patient/records : سجلاتي الطبية ومستنداتي
- /patient/consultations : الاستشارات الطبية العامة (رفع صورة تقرير/أشعة والحصول على رأي AI ثم دكتور)
- /patient/surgery-bookings : حجز عملية
- /patient/notifications : الإشعارات
- /patient/profile : ملفي الشخصي
`;

const DOCTOR_ROUTES = `
- /doctor : لوحة التحكم
- /doctor/appointments : إدارة الحجوزات
- /doctor/booking-settings : إعدادات الحجز
- /doctor/clinic : بيانات العيادة
- /doctor/patients : سجلات المرضى
- /doctor/consultations : الاستشارات الطبية العامة
- /doctor/surgery-bookings : طلبات حجز العمليات
- /doctor/notifications : إشعارات المرضى
- /doctor/account-settings : إعدادات الحساب
`;

const HOSPITAL_ROUTES = `
- /hospital : الرئيسية
- /hospital/emergency : حالات الطوارئ
- /hospital/surgery-bookings : طلبات حجز العمليات
- /hospital/notifications : الإشعارات
- /hospital/profile : الملف الشخصي للمستشفى
`;

const ADMIN_ROUTES = `
- /admin : لوحة التحكم
- /admin/doctors : إدارة الأطباء
- /admin/hospitals : إدارة المستشفيات
- /admin/patients : إدارة المرضى
- /admin/clinics : إدارة العيادات
- /admin/profile : الملف الشخصي
`;

function routesFor(role?: string) {
  if (role === 'Patient') return PUBLIC_ROUTES + PATIENT_ROUTES;
  if (role === 'Doctor') return PUBLIC_ROUTES + DOCTOR_ROUTES;
  if (role === 'Hospital') return PUBLIC_ROUTES + HOSPITAL_ROUTES;
  if (role === 'Admin') return PUBLIC_ROUTES + ADMIN_ROUTES;
  return PUBLIC_ROUTES;
}

@Injectable()
export class AssistantService {
  private genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.get('GEMINI_API_KEY')!,
    );
  }

  async chat(message: string, role?: string): Promise<{ reply: string; route: string | null }> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-3.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `أنت مساعد داخل منصة "نبض" لإدارة العيادات الطبية. مهمتك الوحيدة توجيه المستخدم لمكان الصفحة اللي عايزها جوه الموقع نفسه.
حالة المستخدم الحالية: ${role ? `مسجّل دخول كـ ${role}` : 'زائر غير مسجّل دخول'}.
الصفحات المتاحة له فعليًا دلوقتي بس (ممنوع تقترح أي رابط غيرهم):
${routesFor(role)}

رسالة المستخدم: "${message}"

رد بصيغة JSON بس، بدون أي نص إضافي أو Markdown، بالشكل ده بالظبط:
{"reply": "رد قصير وودود بالعربي المصري يشرح هتوديه فين وليه (سطر أو اتنين بس)", "route": "المسار المناسب من القايمة فوق، أو null لو السؤال مش عن التنقل في الموقع"}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      return {
        reply: typeof parsed.reply === 'string' ? parsed.reply : 'تمام، إزاي أقدر أساعدك؟',
        route: typeof parsed.route === 'string' ? parsed.route : null,
      };
    } catch {
      return {
        reply: 'معلش، مش قادر أفهم طلبك دلوقتي. ممكن توضحه أكتر؟',
        route: null,
      };
    }
  }
}
