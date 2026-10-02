import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { UPLOAD_LIMITS, UPLOAD_LIMITS_MULTI } from '@common/constants';

/**
 * قبل كده FileInterceptor كان من غير أي limits: أي حد يقدر يبعت ملف كبير جدًا (يتحمّل كامل
 * في الميموري بالـ Buffer قبل ما نوصل أصلًا لـ validateFileMagicNumber) → DoS محتمل على
 * سيرفر Vercel serverless محدود الميموري. 5MB كافية لصورة روشتة/مستند.
 */
export const imageUploadOptions: MulterOptions = {
  limits: UPLOAD_LIMITS,
};

/** نفس الفكرة، لكن لـ FilesInterceptor (أكتر من ملف في نفس الوقت، زي تقارير حجز العمليات). */
export const multiImageUploadOptions: MulterOptions = {
  limits: UPLOAD_LIMITS_MULTI,
};
