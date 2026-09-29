import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { UPLOAD_LIMITS } from '@common/constants';

/**
 * قبل كده FileInterceptor كان من غير أي limits: أي حد يقدر يبعت ملف كبير جدًا (يتحمّل كامل
 * في الميموري بالـ Buffer قبل ما نوصل أصلًا لـ validateFileMagicNumber) → DoS محتمل على
 * سيرفر Vercel serverless محدود الميموري. 5MB كافية لصورة روشتة/مستند.
 */
export const imageUploadOptions: MulterOptions = {
  limits: UPLOAD_LIMITS,
};
