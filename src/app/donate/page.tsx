"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import OrnamentalDivider from "@/components/temple/OrnamentalDivider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DonorData {
  donorName: string;
  mobile: string;
  address: string;
  city: string;
  district: string;
  state: string;
}

interface FieldErrors {
  donorName?: string;
  mobile?: string;
  address?: string;
  consent?: string;
}

const PRESET_AMOUNTS = [100, 501, 1001, 2001, 5001, 11001];

const INITIAL_DONOR: DonorData = {
  donorName: "",
  mobile: "",
  address: "",
  city: "",
  district: "",
  state: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN");
}

function validateMobile(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "कृपया मोबाइल नंबर दर्ज करें।";
  if (!/^[6-9]/.test(digits)) return "मोबाइल नंबर 6, 7, 8, या 9 से शुरू होना चाहिए।";
  if (digits.length !== 10) return "मोबाइल नंबर 10 अंकों का होना चाहिए।";
  return undefined;
}

function validateName(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "कृपया अपना पूरा नाम दर्ज करें।";
  if (trimmed.length < 2) return "नाम कम से कम 2 अक्षर का होना चाहिए।";
  return undefined;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { n: 1, label: "राशि" },
    { n: 2, label: "विवरण" },
    { n: 3, label: "भुगतान" },
  { n: 4, label: "पुष्टि" },
  ];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6">
      {steps.map((step, idx) => (
        <div key={step.n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <span
              className={`
                flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-semibold transition-colors
                ${
                  currentStep >= step.n
                    ? "bg-elegant-orange text-warm-white"
                    : "bg-light-beige text-muted-brown"
                }
              `}
            >
              {currentStep > step.n ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                step.n
              )}
            </span>
            <span
              className={`text-[10px] sm:text-xs ${
                currentStep >= step.n ? "text-elegant-orange font-medium" : "text-muted-brown"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 rounded-full transition-colors ${
                currentStep > step.n ? "bg-elegant-orange" : "bg-light-beige"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Donation Amount
// ---------------------------------------------------------------------------

function StepAmount({
  amount,
  setAmount,
  onProceed,
}: {
  amount: number | null;
  setAmount: (a: number | null) => void;
  onProceed: () => void;
}) {
  const [customInput, setCustomInput] = useState("");
  const [amountError, setAmountError] = useState("");

  const selectPreset = useCallback(
    (value: number) => {
      setAmount(value);
      setCustomInput("");
      setAmountError("");
    },
    [setAmount]
  );

  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setCustomInput(raw);
      setAmountError("");
      const num = parseInt(raw, 10);
      if (raw.length > 0 && !isNaN(num)) {
        setAmount(num);
      } else {
        setAmount(null);
      }
    },
    [setAmount]
  );

  const handleProceed = () => {
    if (amount === null || amount < 100) {
      setAmountError(
        "क्षमा करें, कृपया \u20B9100 या उससे अधिक की दान राशि दर्ज करें।"
      );
      return;
    }
    onProceed();
  };

  const isPreset = (value: number) => amount === value && customInput === "";
  const canProceed = amount !== null && amount >= 100;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-deep-warm-brown text-center leading-relaxed">
        मंदिर निर्माण हेतु दान करें
      </h1>
      <p className="text-sm text-muted-brown text-center mt-2 leading-relaxed">
        आपकी श्रद्धा और सहयोग इस पावन मंदिर निर्माण कार्य में महत्वपूर्ण योगदान है।
      </p>

      <OrnamentalDivider />

      <p className="text-center text-elegant-orange font-semibold text-base sm:text-lg tracking-wide">
        कृष्णकुंज माँ कर्मा धाम
      </p>

      {/* Preset Amount Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        {PRESET_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => selectPreset(value)}
            className={`
              rounded-full border-2 py-3 text-base sm:text-lg font-semibold transition-all duration-200
              ${
                isPreset(value)
                  ? "bg-elegant-orange text-warm-white border-elegant-orange shadow-md"
                  : "bg-warm-white text-deep-warm-brown border-light-gold hover:bg-elegant-orange hover:text-warm-white hover:border-elegant-orange"
              }
            `}
          >
            {formatCurrency(value)}
          </button>
        ))}
      </div>

      {/* Custom Amount Input */}
      <div className="mt-6">
        <label
          htmlFor="custom-amount"
          className="block text-sm font-medium text-muted-brown mb-2"
        >
          अपनी दान राशि दर्ज करें
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-brown text-base font-medium">
            ₹
          </span>
          <input
            id="custom-amount"
            type="number"
            min={100}
            placeholder="₹100 से अधिक"
            value={customInput}
            onChange={handleCustomChange}
            className="
              w-full rounded-xl border-2 border-light-beige bg-warm-white text-deep-warm-brown
              placeholder:text-muted-brown/60
              focus:border-soft-saffron focus:outline-none focus:ring-2 focus:ring-soft-saffron/30
              pl-8 pr-4 py-3 text-base
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            "
          />
        </div>
      </div>

      {/* Error Message */}
      {amountError && (
        <p className="mt-3 text-sm text-deep-maroon text-center font-medium">
          {amountError}
        </p>
      )}

      {/* Proceed Button */}
      <button
        type="button"
        onClick={handleProceed}
        disabled={!canProceed}
        className={`
          mt-6 w-full rounded-full py-3.5 text-base font-semibold transition-all duration-200
          ${
            canProceed
              ? "bg-elegant-orange text-warm-white hover:bg-soft-saffron shadow-md active:scale-[0.98]"
              : "bg-light-beige text-muted-brown/50 cursor-not-allowed"
          }
        `}
      >
        आगे बढ़ें
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Donor Details
// ---------------------------------------------------------------------------

function StepDetails({
  amount,
  donorData,
  setDonorData,
  errors,
  setErrors,
  onBack,
  onProceed,
}: {
  amount: number;
  donorData: DonorData;
  setDonorData: React.Dispatch<React.SetStateAction<DonorData>>;
  errors: FieldErrors;
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  onBack: () => void;
  onProceed: () => void;
}) {
  const [consent, setConsent] = useState(false);

  const updateField = (field: keyof DonorData, value: string) => {
    setDonorData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (field === "donorName" || field === "mobile" || field === "address") {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProceed = () => {
    const newErrors: FieldErrors = {};
    const nameErr = validateName(donorData.donorName);
    if (nameErr) newErrors.donorName = nameErr;

    const mobileErr = validateMobile(donorData.mobile);
    if (mobileErr) newErrors.mobile = mobileErr;

    if (!donorData.address.trim()) {
      newErrors.address = "कृपया अपना पता दर्ज करें।";
    }

    if (!consent) {
      newErrors.consent = "कृपया ऊपर दिए गए कथन पर सहमति दें।";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onProceed();
  };

  const inputClass = `
    w-full rounded-xl border-2 border-light-beige bg-warm-white text-deep-warm-brown
    placeholder:text-muted-brown/50
    focus:border-soft-saffron focus:outline-none focus:ring-2 focus:ring-soft-saffron/30
    px-4 py-3 text-base transition-colors
  `;

  const labelClass = "block text-sm font-medium text-muted-brown mb-1.5";
  const errorClass = "text-sm text-deep-maroon mt-1";
  const requiredMark = <span className="text-deep-maroon">*</span>;

  return (
    <div>
      {/* Amount Display */}
      <div className="text-center mb-6">
        <p className="text-sm text-muted-brown mb-1">आपका दान</p>
        <p className="text-3xl sm:text-4xl font-bold text-elegant-orange">
          ₹{formatCurrency(amount)}
        </p>
      </div>

      <OrnamentalDivider />

      {/* Required Fields */}
      <div className="space-y-4 mt-4">
        <div>
          <label htmlFor="donorName" className={labelClass}>
            पूरा नाम{requiredMark}
          </label>
          <input
            id="donorName"
            type="text"
            placeholder="अपना पूरा नाम लिखें"
            value={donorData.donorName}
            onChange={(e) => updateField("donorName", e.target.value)}
            className={`${inputClass} ${errors.donorName ? "border-deep-maroon" : ""}`}
          />
          {errors.donorName && <p className={errorClass}>{errors.donorName}</p>}
        </div>

        <div>
          <label htmlFor="mobile" className={labelClass}>
            मोबाइल नंबर{requiredMark}
          </label>
          <input
            id="mobile"
            type="tel"
            maxLength={10}
            placeholder="10 अंकों का मोबाइल नंबर"
            value={donorData.mobile}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
              updateField("mobile", digits);
            }}
            className={`${inputClass} ${errors.mobile ? "border-deep-maroon" : ""}`}
          />
          {errors.mobile && <p className={errorClass}>{errors.mobile}</p>}
        </div>

        {/* Address — Required */}
        <div>
          <label htmlFor="address" className={labelClass}>
            पता{requiredMark}
          </label>
          <input
            id="address"
            type="text"
            placeholder="मकान नंबर, गली / मोहल्ला"
            value={donorData.address}
            onChange={(e) => updateField("address", e.target.value)}
            className={`${inputClass} ${errors.address ? "border-deep-maroon" : ""}`}
          />
          {errors.address && <p className={errorClass}>{errors.address}</p>}
        </div>

        {/* Optional Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className={labelClass}>
              शहर
            </label>
            <input
              id="city"
              type="text"
              placeholder="शहर"
              value={donorData.city}
              onChange={(e) => updateField("city", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="district" className={labelClass}>
              जिला
            </label>
            <input
              id="district"
              type="text"
              placeholder="जिला"
              value={donorData.district}
              onChange={(e) => updateField("district", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="state" className={labelClass}>
            राज्य
          </label>
          <input
            id="state"
            type="text"
            placeholder="राज्य"
            value={donorData.state}
            onChange={(e) => updateField("state", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Consent Checkbox */}
      <div className="mt-6 flex items-start gap-3">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(checked) => {
            setConsent(checked === true);
            if (checked === true) {
              setErrors((prev) => ({ ...prev, consent: undefined }));
            }
          }}
          className="mt-0.5 data-[state=checked]:bg-elegant-orange data-[state=checked]:border-elegant-orange"
        />
        <label
          htmlFor="consent"
          className="text-sm text-deep-warm-brown leading-relaxed cursor-pointer select-none"
        >
          मैं मंदिर निर्माण हेतु अपनी श्रद्धानुसार दान कर रहा/रही हूँ।
        </label>
      </div>
      {errors.consent && (
        <p className={errorClass}>{errors.consent}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={onBack}
          className="
            flex-1 rounded-full border-2 border-light-gold py-3.5 text-base font-semibold
            text-deep-warm-brown bg-warm-white hover:bg-warm-ivory transition-all duration-200
            active:scale-[0.98]
          "
        >
          वापस जाएं
        </button>
        <button
          type="button"
          onClick={handleProceed}
          className="
            flex-[2] rounded-full py-3.5 text-base font-semibold transition-all duration-200
            bg-elegant-orange text-warm-white hover:bg-soft-saffron shadow-md active:scale-[0.98]
          "
        >
          भुगतान के लिए आगे बढ़ें
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Payment Summary + QR
// ---------------------------------------------------------------------------

function StepPayment({
  amount,
  donorData,
  existingOrderId,
  onBack,
  onSuccess,
}: {
  amount: number;
  donorData: DonorData;
  existingOrderId: string;
  onBack: () => void;
  onSuccess: (orderId: string) => void;
}) {
  const [loading, setLoading] = useState(!existingOrderId);
  const [orderError, setOrderError] = useState("");
  const [orderId, setOrderId] = useState<string | null>(existingOrderId || null);
  const [upiLink, setUpiLink] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [confirming, setConfirming] = useState(false);

  // Create order & QR on mount (skip if already created)
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        let link = '';

        if (existingOrderId) {
          const params = new URLSearchParams({
            pa: 'sahubhagwat392@indianbk',
            pn: 'कृष्णकुंज माँ कर्मा धाम',
            am: String(amount),
            cu: 'INR',
            tn: `मंदिर निर्माण दान - ₹${amount}`,
          });
          link = `upi://pay?${params.toString()}`;
          setUpiLink(link);
        } else {
          const res = await fetch('/api/donate/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              donorName: donorData.donorName.trim(),
              mobile: donorData.mobile,
              address: donorData.address.trim() || undefined,
              city: donorData.city || undefined,
              district: donorData.district || undefined,
              state: donorData.state || undefined,
            }),
          });
          const data = await res.json();
          if (cancelled) return;
          if (!data.success) {
            setOrderError(data.error || 'दान आदेश बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
            setLoading(false);
            return;
          }
          setOrderId(data.orderId);
          link = data.upiLink;
          setUpiLink(link);
        }

        // Generate QR code with exact amount
        const QRCode = await import('qrcode');
        const qrUrl = await QRCode.toDataURL(link, {
          width: 280,
          margin: 2,
          color: { dark: '#5A3A24', light: '#FFFFFF' },
        });
        if (!cancelled) {
          setQrDataUrl(qrUrl);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setOrderError('भुगतान पृष्ठ लोड करने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
          setLoading(false);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmPayment = async () => {
    if (!orderId) return;
    setConfirming(true);
    try {
      await fetch("/api/donate/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      onSuccess(orderId);
    } catch {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div
          className="w-10 h-10 border-4 border-light-beige border-t-elegant-orange rounded-full animate-spin"
        />
        <p className="mt-4 text-sm text-muted-brown">भुगतान पृष्ठ तैयार हो रहा है...</p>
      </div>
    );
  }

  if (orderError) {
    return (
      <div>
        <div className="text-center py-8">
          <p className="text-deep-maroon text-sm font-medium">{orderError}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="
            w-full rounded-full border-2 border-light-gold py-3.5 text-base font-semibold
            text-deep-warm-brown bg-warm-white hover:bg-warm-ivory transition-all duration-200
            active:scale-[0.98]
          "
        >
          वापस जाएं
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="rounded-2xl border-2 border-light-beige bg-warm-white p-4 sm:p-5 mb-6">
        <h2 className="text-base font-semibold text-deep-warm-brown mb-3">
          दान विवरण
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-brown">मंदिर</span>
            <span className="text-deep-warm-brown font-medium">
              कृष्णकुंज माँ कर्मा धाम
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-brown">दानदाता</span>
            <span className="text-deep-warm-brown font-medium">
              {donorData.donorName}
            </span>
          </div>
          <div className="h-px bg-light-beige my-2" />
          <div className="flex justify-between items-center">
            <span className="text-muted-brown">दान राशि</span>
            <span className="text-elegant-orange font-bold text-lg">
              ₹{formatCurrency(amount)}
            </span>
          </div>
        </div>
      </div>

      {/* QR Code Card */}
      <div className="rounded-2xl border-2 border-light-gold bg-warm-white p-5 sm:p-6 text-center">
        <p className="text-base sm:text-lg font-semibold text-deep-warm-brown mb-1">
          UPI QR कोड स्कैन करें
        </p>
        <p className="text-sm text-elegant-orange font-semibold mb-4">
          ₹{formatCurrency(amount)} का दान करें
        </p>

        {qrDataUrl && (
          <div className="inline-block p-3 rounded-2xl border-2 border-light-gold bg-warm-white shadow-sm">
            <img
              src={qrDataUrl}
              alt={`UPI QR - ₹${formatCurrency(amount)} दान करें`}
              width={240}
              height={240}
              className="w-52 h-52 sm:w-60 sm:h-60 mx-auto"
            />
          </div>
        )}

        <p className="text-xs text-muted-brown mt-3 leading-relaxed">
          किसी भी UPI ऐप से स्कैन करें — ₹{formatCurrency(amount)} ऑटो-भर जाएगा<br/>
          <span className="font-semibold text-deep-warm-brown">UPI ID: sahubhagwat392@indianbk</span>
        </p>
      </div>

      {/* UPI Pay Button */}
      <a
        href={upiLink}
        className="
          mt-5 w-full flex items-center justify-center rounded-full py-3.5 text-base font-semibold
          bg-elegant-orange text-warm-white hover:bg-soft-saffron shadow-md transition-all duration-200
          active:scale-[0.98]
        "
      >
        UPI से भुगतान करें
      </a>

      {/* Confirm Payment Button */}
      <button
        type="button"
        onClick={handleConfirmPayment}
        disabled={confirming}
        className={`
          mt-3 w-full rounded-full py-3.5 text-base font-semibold transition-all duration-200
          ${
            confirming
              ? "bg-light-beige text-muted-brown/50 cursor-not-allowed"
              : "border-2 border-elegant-orange text-elegant-orange bg-warm-white hover:bg-warm-ivory active:scale-[0.98]"
          }
        `}
      >
        {confirming ? "सत्यापित हो रहा है..." : "मैंने भुगतान कर दिया"}
      </button>

      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="
          mt-3 w-full rounded-full border-2 border-light-beige py-3 text-sm font-medium
          text-muted-brown bg-warm-white hover:bg-warm-ivory transition-all duration-200
        "
      >
        वापस जाएं
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Payment Processing
// ---------------------------------------------------------------------------

function StepProcessing({ orderId }: { orderId: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await fetch("/api/donate/mark-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
      } catch {
        // Even if mark-success fails, still redirect to success page
      }
      router.push(`/donate/success/${orderId}`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [orderId, router]);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className="w-12 h-12 border-4 border-light-beige border-t-elegant-orange rounded-full animate-spin"
        role="status"
        aria-label="भुगतान सत्यापित हो रहा है"
      />
      <p className="mt-6 text-lg font-semibold text-deep-warm-brown">
        भुगतान सत्यापित किया जा रहा है...
      </p>
      <p className="mt-2 text-sm text-muted-brown">कृपया कुछ क्षण प्रतीक्षा करें।</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function DonatePage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [amount, setAmount] = useState<number | null>(null);
  const [donorData, setDonorData] = useState<DonorData>(INITIAL_DONOR);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [orderId, setOrderId] = useState("");

  return (
    <div className="max-w-lg mx-auto px-4 py-6 sm:py-10">
      <StepIndicator currentStep={step} />

      {step === 1 && (
        <StepAmount
          amount={amount}
          setAmount={setAmount}
          onProceed={() => setStep(2)}
        />
      )}

      {step === 2 && amount && (
        <StepDetails
          amount={amount}
          donorData={donorData}
          setDonorData={setDonorData}
          errors={errors}
          setErrors={setErrors}
          onBack={() => setStep(1)}
          onProceed={() => setStep(3)}
        />
      )}

      {step === 3 && amount && (
        <StepPayment
          amount={amount}
          donorData={donorData}
          existingOrderId={orderId}
          onBack={() => setStep(2)}
          onSuccess={(id) => {
            setOrderId(id);
            setStep(4);
          }}
        />
      )}

      {step === 4 && orderId && <StepProcessing orderId={orderId} />}
    </div>
  );
}
