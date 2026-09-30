// consultation-analyzer.service.ts
// خدمة منفصلة عن PrescriptionExtractorService عمدًا (نفس الفكرة، Gemini، لكن
// prompt مختلف تمامًا: هنا بنحلّل تقرير/أشعة ونرد برد نصي حواري، مش JSON منظّم).
// فصلها عن بعض يمنع أي تعديل هنا يأثر على شاشة "روشتة جديدة" الموجودة والشغالة.
import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

const SYSTEM_PROMPT = `أنت مساعد طبي داخل منصة "نبض" لإدارة العيادات. مريض رفع صورة تقرير طبي أو أشعة وسأل سؤالًا (لو وجد).
اكتب ردًا موجزًا وواضحًا بالعربية يشرح المحتوى الظاهر في الصورة بشكل عام (مبدئي وليس تشخيصًا نهائيًا).
لو الصورة مش واضحة أو مش تقرير طبي، قول ذلك بصراحة.
لازم تنهي ردك دايمًا بجملة تنص على أن هذا تحليل أولي من الذكاء الاصطناعي ولا يغني عن مراجعة طبيب، وأن أحد الأطباء سيراجع الاستشارة قريبًا.
لا تكتب أي تنسيق Markdown أو رموز خاصة، فقرة نصية عادية بس.`;

@Injectable()
export class ConsultationAnalyzerService {
  private genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.get('GEMINI_API_KEY')!,
    );
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async analyze(buffer: Buffer, mimeType: string, question?: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
    const prompt = question
      ? `${SYSTEM_PROMPT}\n\nسؤال المريض: ${question}`
      : SYSTEM_PROMPT;

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await model.generateContent([
          prompt,
          { inlineData: { data: buffer.toString('base64'), mimeType } },
        ]);
        const text = result.response.text().trim();
        return text || this.fallbackMessage();
      } catch (error: any) {
        const isOverloaded = error?.status === 503;
        if (isOverloaded && attempt < maxRetries - 1) {
          await this.sleep(1000 * Math.pow(2, attempt));
          continue;
        }
        // فشل الـ AI مبيوقفش رفع الاستشارة — بترجع رسالة واضحة والدكتور هيراجعها برضو
        return this.fallbackMessage();
      }
    }
    return this.fallbackMessage();
  }

  private fallbackMessage() {
    return 'تعذّر تحليل الصورة تلقائيًا في الوقت الحالي. تم استلام استشارتك وسيقوم أحد الأطباء بمراجعتها في أقرب وقت.';
  }
}
