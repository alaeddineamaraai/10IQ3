export type Plan = "free" | "pro" | "elite";

export type AthleteProfile = {
  id: string;
  email: string;
  name: string | null;
  plan: Plan;
  emails_used: number;
  plan_started_at: string | null;
  email_credits: number;
  utr: number | null;
  grad_year: number | null;
  gpa: number | null;
  rank: number | null;
  wtn: number | null;
  gender: string | null;
  school: string | null;
  academy: string | null;
  location: string | null;
  singles_record: string | null;
  doubles_record: string | null;
  style: string | null;
  target_div: string | null;
  region: string | null;
  video_link: string | null;
  utr_sports_link: string | null;
  ai_notes: string | null;
  instagram_token: string | null;
  profile_complete: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  promo_plan: string | null;
  promo_expires_at: string | null;
  created_at: string;
};

export type OnboardingData = Pick<
  AthleteProfile,
  | "utr"
  | "grad_year"
  | "gpa"
  | "rank"
  | "wtn"
  | "gender"
  | "school"
  | "academy"
  | "location"
  | "singles_record"
  | "doubles_record"
  | "style"
  | "target_div"
  | "region"
  | "video_link"
  | "utr_sports_link"
  | "ai_notes"
>;
