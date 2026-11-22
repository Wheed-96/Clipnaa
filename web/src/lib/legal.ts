import type { Lang } from "@/lib/i18n";

/** Where customers write to. Set NEXT_PUBLIC_SUPPORT_EMAIL in Vercel to an inbox you read. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@clipnaa.com";

export const LEGAL_UPDATED = "2026-11-20";

export type LegalDoc = "terms" | "privacy" | "refund";
export const LEGAL_DOCS: LegalDoc[] = ["terms", "privacy", "refund"];

type Section = { h: string; p: string[] };
type Page = { title: string; intro: string; sections: Section[] };

const e = SUPPORT_EMAIL;

const en: Record<LegalDoc, Page> = {
  terms: {
    title: "Terms of Service",
    intro:
      "These terms apply when you use Clipnaa, the service at clipnaa.com that turns long videos into short clips with captions and hashtags. By creating an account or using the service you agree to them.",
    sections: [
      {
        h: "1. Your account",
        p: [
          "You sign in with your email address or Google account. Keep access to them secure, because anyone who can open your sign-in link can use your account.",
          "You must be at least 18 years old, or the age of majority where you live, to buy a subscription.",
        ],
      },
      {
        h: "2. The service",
        p: [
          "Clipnaa analyses the videos you upload or link, picks moments, renders vertical clips and writes suggested captions, hashtags and profile ideas. Results are produced by AI and may contain mistakes. Review every clip and caption before you publish it.",
          "We may change, improve or remove features. If a change materially reduces what a paid plan includes, we will tell you in advance.",
        ],
      },
      {
        h: "3. Your content",
        p: [
          "You keep all rights to the videos you upload and the clips we make from them. You give us permission to store and process them only to provide the service to you.",
          "You confirm that you own the videos you submit, or have permission to use them, and that they do not break any law or anyone else's rights. Do not upload content that is illegal, sexual content involving minors, content that promotes violence or hatred, or content you do not have the right to use.",
          "Uploaded videos and finished clips are deleted automatically 14 days after they are created. Download anything you want to keep.",
        ],
      },
      {
        h: "4. Plans, billing and minutes",
        p: [
          "Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns.",
          "Paid plans renew automatically each month until you cancel. Each plan includes a number of processing minutes per billing period, measured by the length of the source video. Unused minutes do not roll over.",
          "The free plan includes 30 minutes every 30 days and adds a small Clipnaa watermark to clips.",
          "You can cancel at any time from the Billing page. Your plan stays active until the end of the period you paid for. Refunds are covered by our Refund Policy.",
        ],
      },
      {
        h: "5. Fair use",
        p: [
          "Do not try to break, overload or reverse engineer the service, share your account to get around plan limits, or use it to make spam. We may suspend accounts that do, after telling you why where we can.",
        ],
      },
      {
        h: "6. Liability",
        p: [
          "The service is provided as is. To the extent the law allows, we are not liable for indirect losses, lost profits, or results on social media platforms. Our total liability for any claim is limited to the amount you paid us in the 3 months before the claim.",
          "Nothing in these terms limits rights you have under consumer protection law that cannot be waived.",
        ],
      },
      {
        h: "7. Changes and contact",
        p: [
          "We may update these terms. If a change is significant we will email you or show a notice in the app before it takes effect.",
          `Questions? Write to ${e}.`,
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "This policy explains what personal data Clipnaa collects, why, and what control you have over it.",
    sections: [
      {
        h: "1. What we collect",
        p: [
          "Account data: your email address and, if you use Google sign-in, your name and profile picture from Google.",
          "Content: the videos you upload or link, their transcripts, and the clips, captions and hashtags we generate.",
          "Billing data: your plan and subscription status. Payments are handled by Paddle, our Merchant of Record. We never see or store your card details.",
          "Technical data: basic logs such as IP address, browser type and errors, kept to run and secure the service.",
        ],
      },
      {
        h: "2. How we use it",
        p: [
          "To provide the service: sign you in, process your videos, show your clips, and track your minutes.",
          "To bill you through Paddle, send service emails such as sign-in links and important notices, and give support.",
          "We do not sell your data, and we do not use your videos to train AI models.",
        ],
      },
      {
        h: "3. Services we rely on",
        p: [
          "We share data only with providers that help us run Clipnaa, and only what each one needs: Supabase (accounts and database), Cloudflare R2 (video storage), Modal (video processing), Anthropic (AI analysis of transcripts), Vercel (website hosting) and Paddle (payments). Some of them process data outside your country, under their own data protection terms.",
        ],
      },
      {
        h: "4. How long we keep it",
        p: [
          "Uploaded videos and finished clips are deleted automatically after 14 days. Job details, captions and your account stay until you delete your account. Paddle keeps billing records as the law requires.",
        ],
      },
      {
        h: "5. Your rights",
        p: [
          `You can ask for a copy of your data, ask us to correct it, or ask us to delete your account and everything linked to it. Write to ${e} from the email on your account and we will reply within 30 days.`,
        ],
      },
      {
        h: "6. Cookies",
        p: [
          "We use only the cookies needed to keep you signed in. We do not use advertising or tracking cookies. Paddle's checkout may set its own cookies to process payments securely.",
        ],
      },
      {
        h: "7. Contact",
        p: [`For any privacy question, write to ${e}. If we change this policy in a significant way, we will tell you by email or in the app.`],
      },
    ],
  },
  refund: {
    title: "Refund Policy",
    intro: "We want you to be happy with Clipnaa. If you are not, here is how refunds work.",
    sections: [
      {
        h: "1. 14-day money-back guarantee",
        p: [
          "If you are not satisfied, you can ask for a full refund within 14 days of your first payment for a plan, for any reason.",
          "Renewals can also be refunded within 14 days of the renewal date if you have not used any minutes in that new period.",
        ],
      },
      {
        h: "2. How to ask",
        p: [
          `Write to ${e} from the email on your account, or reply to your Paddle receipt. Paddle, our Merchant of Record, processes all refunds. Refunds go back to your original payment method, usually within 5 to 10 business days.`,
        ],
      },
      {
        h: "3. Cancelling",
        p: [
          "You can cancel anytime from the Billing page. Cancelling stops future renewals, and you keep your plan until the end of the period you paid for.",
        ],
      },
      {
        h: "4. Your legal rights",
        p: ["This policy does not affect any rights you have under the consumer law of your country."],
      },
    ],
  },
};

const ar: Record<LegalDoc, Page> = {
  terms: {
    title: "شروط الخدمة",
    intro:
      "تنطبق هذه الشروط عند استخدامك كليبنا، الخدمة على clipnaa.com التي تحوّل الفيديوهات الطويلة إلى مقاطع قصيرة مع كابشن وهاشتاقات. بإنشاء حساب أو استخدام الخدمة فأنت توافق عليها.",
    sections: [
      {
        h: "١. حسابك",
        p: [
          "تسجّل الدخول ببريدك الإلكتروني أو حساب قوقل. حافظ على أمانهما، لأن أي شخص يقدر يفتح رابط الدخول يقدر يستخدم حسابك.",
          "يجب أن يكون عمرك ١٨ سنة على الأقل، أو سن الرشد في بلدك، لشراء اشتراك.",
        ],
      },
      {
        h: "٢. الخدمة",
        p: [
          "يحلل كليبنا الفيديوهات التي ترفعها أو ترسل روابطها، ويختار أفضل اللحظات، ويصنع مقاطع عمودية، ويقترح الكابشن والهاشتاقات وأفكار الحسابات. النتائج من إنتاج الذكاء الاصطناعي وقد تحتوي أخطاء، فراجع كل مقطع وكابشن قبل نشره.",
          "قد نغيّر الميزات أو نطوّرها أو نزيلها. وإذا قلّل التغيير بشكل كبير مما تتضمنه خطة مدفوعة، فسنبلغك مسبقًا.",
        ],
      },
      {
        h: "٣. محتواك",
        p: [
          "تبقى جميع حقوق الفيديوهات التي ترفعها والمقاطع التي نصنعها منها لك. وتمنحنا الإذن بتخزينها ومعالجتها فقط لتقديم الخدمة لك.",
          "تؤكد أنك تملك الفيديوهات التي ترسلها أو لديك إذن باستخدامها، وأنها لا تخالف أي قانون أو حقوق أي شخص. لا ترفع محتوى غير قانوني، أو محتوى جنسيًا يتعلق بقاصرين، أو محتوى يحرّض على العنف أو الكراهية، أو محتوى لا تملك حق استخدامه.",
          "تُحذف الفيديوهات المرفوعة والمقاطع الجاهزة تلقائيًا بعد ١٤ يومًا من إنشائها، فحمّل ما تريد الاحتفاظ به.",
        ],
      },
      {
        h: "٤. الخطط والفوترة والدقائق",
        p: [
          "تتم عملية الطلب عبر بائعنا الإلكتروني Paddle.com، وهو البائع الرسمي (Merchant of Record) لجميع طلباتنا، ويتولى جميع استفسارات العملاء والمرتجعات.",
          "تتجدد الخطط المدفوعة تلقائيًا كل شهر حتى تلغيها. تشمل كل خطة عددًا من دقائق المعالجة في كل فترة فوترة، تُحسب حسب طول الفيديو الأصلي، والدقائق غير المستخدمة لا تُرحّل.",
          "تشمل الخطة المجانية ٣٠ دقيقة كل ٣٠ يومًا، وتضيف علامة كليبنا صغيرة على المقاطع.",
          "تقدر تلغي في أي وقت من صفحة الاشتراك، وتبقى خطتك فعّالة حتى نهاية الفترة المدفوعة. وتخضع المبالغ المستردة لسياسة الاسترداد.",
        ],
      },
      {
        h: "٥. الاستخدام العادل",
        p: [
          "لا تحاول تعطيل الخدمة أو إثقالها أو الهندسة العكسية لها، ولا تشارك حسابك لتجاوز حدود الخطة، ولا تستخدمها لصنع محتوى مزعج (سبام). قد نوقف الحسابات المخالفة، مع توضيح السبب متى أمكن.",
        ],
      },
      {
        h: "٦. المسؤولية",
        p: [
          "تُقدَّم الخدمة كما هي. وبالقدر الذي يسمح به القانون، لسنا مسؤولين عن الخسائر غير المباشرة أو الأرباح الفائتة أو نتائج المنصات الاجتماعية. ومسؤوليتنا الإجمالية عن أي مطالبة محدودة بالمبلغ الذي دفعته لنا خلال ٣ أشهر قبل المطالبة.",
          "لا شيء في هذه الشروط يقيّد حقوقك بموجب قوانين حماية المستهلك التي لا يجوز التنازل عنها.",
        ],
      },
      {
        h: "٧. التعديلات والتواصل",
        p: [
          "قد نحدّث هذه الشروط، وإذا كان التغيير جوهريًا فسنراسلك أو نعرض تنبيهًا في التطبيق قبل سريانه.",
          `لأي سؤال، راسلنا على ${e}.`,
        ],
      },
    ],
  },
  privacy: {
    title: "سياسة الخصوصية",
    intro: "توضح هذه السياسة البيانات الشخصية التي يجمعها كليبنا، ولماذا، وما تملكه من تحكم فيها.",
    sections: [
      {
        h: "١. ما نجمعه",
        p: [
          "بيانات الحساب: بريدك الإلكتروني، وإذا سجّلت عبر قوقل فاسمك وصورتك من قوقل.",
          "المحتوى: الفيديوهات التي ترفعها أو ترسل روابطها، ونصوصها المفرّغة، والمقاطع والكابشن والهاشتاقات التي ننتجها.",
          "بيانات الفوترة: خطتك وحالة اشتراكك. تتم المدفوعات عبر Paddle، البائع الرسمي لدينا، ولا نرى بيانات بطاقتك ولا نخزنها.",
          "البيانات التقنية: سجلات أساسية مثل عنوان IP ونوع المتصفح والأخطاء، نحتفظ بها لتشغيل الخدمة وحمايتها.",
        ],
      },
      {
        h: "٢. كيف نستخدمها",
        p: [
          "لتقديم الخدمة: تسجيل دخولك، ومعالجة فيديوهاتك، وعرض مقاطعك، وحساب دقائقك.",
          "للفوترة عبر Paddle، وإرسال رسائل الخدمة مثل روابط الدخول والتنبيهات المهمة، وتقديم الدعم.",
          "لا نبيع بياناتك، ولا نستخدم فيديوهاتك لتدريب نماذج الذكاء الاصطناعي.",
        ],
      },
      {
        h: "٣. الخدمات التي نعتمد عليها",
        p: [
          "نشارك البيانات فقط مع مزوّدين يساعدوننا في تشغيل كليبنا، وبالقدر الذي يحتاجه كل منهم: Supabase (الحسابات وقاعدة البيانات)، وCloudflare R2 (تخزين الفيديو)، وModal (معالجة الفيديو)، وAnthropic (تحليل النصوص بالذكاء الاصطناعي)، وVercel (استضافة الموقع)، وPaddle (المدفوعات). وقد يعالج بعضهم البيانات خارج بلدك وفق شروط حماية البيانات الخاصة بهم.",
        ],
      },
      {
        h: "٤. مدة الاحتفاظ",
        p: [
          "تُحذف الفيديوهات المرفوعة والمقاطع الجاهزة تلقائيًا بعد ١٤ يومًا. وتبقى تفاصيل المهام والكابشن وحسابك حتى تحذف حسابك. ويحتفظ Paddle بسجلات الفوترة حسب ما يتطلبه القانون.",
        ],
      },
      {
        h: "٥. حقوقك",
        p: [
          `يحق لك طلب نسخة من بياناتك أو تصحيحها أو حذف حسابك وكل ما يرتبط به. راسلنا على ${e} من البريد المسجّل في حسابك، وسنرد خلال ٣٠ يومًا.`,
        ],
      },
      {
        h: "٦. ملفات تعريف الارتباط (الكوكيز)",
        p: [
          "نستخدم فقط الكوكيز اللازمة لإبقائك مسجّل الدخول، ولا نستخدم كوكيز إعلانية أو للتتبع. وقد تضع صفحة الدفع من Paddle كوكيز خاصة بها لمعالجة المدفوعات بأمان.",
        ],
      },
      {
        h: "٧. التواصل",
        p: [`لأي سؤال عن الخصوصية، راسلنا على ${e}. وإذا غيّرنا هذه السياسة بشكل جوهري فسنبلغك بالبريد أو داخل التطبيق.`],
      },
    ],
  },
  refund: {
    title: "سياسة الاسترداد",
    intro: "نبي تكون راضي عن كليبنا. وإذا ما كنت راضي، هذي طريقة الاسترداد.",
    sections: [
      {
        h: "١. ضمان استرداد خلال ١٤ يومًا",
        p: [
          "إذا لم تكن راضيًا، يحق لك طلب استرداد كامل خلال ١٤ يومًا من أول دفعة لأي خطة، لأي سبب.",
          "ويمكن أيضًا استرداد مبلغ التجديد خلال ١٤ يومًا من تاريخ التجديد إذا لم تستخدم أي دقائق في الفترة الجديدة.",
        ],
      },
      {
        h: "٢. طريقة الطلب",
        p: [
          `راسلنا على ${e} من البريد المسجّل في حسابك، أو رد على إيصال Paddle. يتولى Paddle، البائع الرسمي لدينا، معالجة جميع المبالغ المستردة، وتعود إلى وسيلة الدفع الأصلية عادة خلال ٥ إلى ١٠ أيام عمل.`,
        ],
      },
      {
        h: "٣. الإلغاء",
        p: ["تقدر تلغي في أي وقت من صفحة الاشتراك. الإلغاء يوقف التجديدات القادمة، وتبقى خطتك فعّالة حتى نهاية الفترة المدفوعة."],
      },
      {
        h: "٤. حقوقك القانونية",
        p: ["لا تؤثر هذه السياسة على أي حقوق لك بموجب قانون حماية المستهلك في بلدك."],
      },
    ],
  },
};

export function legal(lang: Lang, doc: LegalDoc): Page {
  return (lang === "ar" ? ar : en)[doc];
}
