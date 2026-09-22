import { z } from "zod";
import { emptyToUndefined } from "../../common/validation/empty-to-undefined";

export const createPartnerRegistrationSchema = z.object({
  shopName: z.string().trim().min(2, "Vui lòng nhập tên phòng khám").max(200),
  ownerName: z.string().trim().min(2, "Vui lòng nhập tên chủ phòng khám").max(100),
  phone: z.string().trim().min(8, "Số điện thoại không hợp lệ").max(20),
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  address: z.string().trim().min(5, "Vui lòng nhập địa chỉ đầy đủ").max(300),
  // Required — Admin needs to actually see the business license to
  // decide whether to approve a clinic, not just take their word for it.
  businessLicense: z.string().url("Vui lòng tải lên giấy đăng ký kinh doanh").max(500),
  vetCertificate: z.preprocess(emptyToUndefined, z.string().url("URL không hợp lệ").max(500).optional()),
});
export type CreatePartnerRegistrationInput = z.infer<typeof createPartnerRegistrationSchema>;

export const rejectPartnerRegistrationSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type RejectPartnerRegistrationInput = z.infer<typeof rejectPartnerRegistrationSchema>;
