import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AssistantChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;

  // بيتبعت من الفرونت بناءً على حالة تسجيل الدخول الحالية (مش هنثق في أي role
  // من الـ body لوحده كصلاحية، ده بس سياق لمساعدة الرد، مفيش أي action حساس هنا)
  @IsOptional()
  @IsIn(['Patient', 'Doctor', 'Admin', 'Hospital'])
  role?: 'Patient' | 'Doctor' | 'Admin' | 'Hospital';
}
