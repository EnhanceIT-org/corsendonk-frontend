import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next"; // Import hook
import validator from "validator";
// Corrected import paths for UI components
import { Textarea } from "../ui/textarea";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "../ui/tooltip";
import { Info } from "lucide-react";
import countries from "i18n-iso-countries";
import nlLocale from "i18n-iso-countries/langs/nl.json";

// Declare the SecureFields type on the global window object
declare global {
  interface Window {
    SecureFields: any; // Use 'any' for simplicity, or define a more specific type if available
  }
}

export function PersonalInformationForm({ bookingData, travelMode }) {
  const { t } = useTranslation(); // Instantiate hook
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    nationality: "België",
    paymentMethod: "kredietkaart",
    creditCardName: "",
    expiry: "",
    notes: "",
  });
  const [contactForBikeRental, setContactForBikeRental] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    nationality: "",
    creditCardName: "",
    creditCard: "",
    cvc: "",
    expiry: "",
    general: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState(null);

  // Datatrans secure fields
  const [isReady, setIsReady] = useState(false);
  const secureFieldsRef = useRef(null);
  const cardNumberPlaceholderRef = useRef(null);
  const cvvPlaceholderRef = useRef(null);

  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://pay.datatrans.com/upp/payment/js/secure-fields-2.0.0.js";
    script.async = true;

    script.onload = () => {
      setIsReady(true);
    };

    document.body.appendChild(script);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
      if (secureFieldsRef.current) {
        secureFieldsRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (
      isReady &&
      cardNumberPlaceholderRef.current &&
      cvvPlaceholderRef.current
    ) {
      try {
        const SecureFields = window.SecureFields;
        if (!SecureFields) {
          // console.error("SecureFields library not loaded");
          setErrors((prev) => ({
            ...prev,
            general: t(
              "personalInfoForm.error.paymentSystemLoadFailed",
              "Payment system could not be loaded. Please refresh the page and try again.",
            ),
          }));
          return;
        }
        secureFieldsRef.current = new SecureFields();

        secureFieldsRef.current.initTokenize(
          "3000013748",
          {
            cardNumber: cardNumberPlaceholderRef.current.id.toString(),
            cvv: cvvPlaceholderRef.current.id.toString(),
          },
          {
            styles: {
              base: {
                fontSize: "16px",
                color: "#333",
                fontFamily: "system-ui, -apple-system, sans-serif",
                padding: "8px 0",
              },
              ":focus": {
                outline: "none",
              },
              "::placeholder": {
                color: "#9ca3af",
              },
            },
          },
        );

        secureFieldsRef.current.on("success", (data) => {
          if (data.transactionId) {
            setTransactionId(data.transactionId);
            submitFormData(data.transactionId);
          } else {
            setErrors((prev) => ({
              ...prev,
              general: t(
                "personalInfoForm.error.creditCardProcessingFailed",
                "An error occurred while processing the credit card.",
              ),
            }));
          }
        });

        secureFieldsRef.current.on("error", (error) => {
          // console.error("Datatrans error:", error);
          const newErrors = { ...errors };

          if (error.field === "cardNumber") {
            newErrors.creditCard = t(
              "personalInfoForm.error.invalidCardNumber",
              "Invalid credit card number",
            );
          } else if (error.field === "cvv") {
            newErrors.cvc = t(
              "personalInfoForm.error.invalidCvc",
              "Invalid CVC/CVV",
            );
          } else {
            newErrors.general = t(
              "personalInfoForm.error.paymentErrorGeneral",
              {
                message: error.message,
                defaultValue: `Payment error: ${error.message}`,
              },
            );
          }

          setErrors(newErrors);
          setIsSubmitting(false);
        });
      } catch (error) {
        // console.error("Error initializing Datatrans:", error);
        setErrors((prev) => ({
          ...prev,
          general: t(
            "personalInfoForm.error.paymentInitFailed",
            "An error occurred while initializing the payment method.",
          ),
        }));
      }
    }
  }, [isReady]);

  useEffect(() => {}, [secureFieldsRef]);

  const clearError = (fieldName) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: "",
      general: "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearError(name);
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    if (name === "contactForBikeRental") {
      setContactForBikeRental(checked);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value;

    // Format automatically as MM/YY
    if (
      value.length === 2 &&
      !value.includes("/") &&
      formData.expiry.length === 1
    ) {
      value = value + "/";
    }

    setFormData((prev) => ({
      ...prev,
      expiry: value,
    }));
    clearError("expiry");
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors }; // Start with existing errors to preserve card/cvc errors from datatrans

    if (!validator.isEmail(formData.email)) {
      newErrors.email = t(
        "personalInfoForm.validation.invalidEmail",
        "Please enter a valid email address",
      );
      isValid = false;
    }

    if (formData.firstName.trim().length < 2) {
      newErrors.firstName = t(
        "personalInfoForm.validation.firstNameTooShort",
        "First name must be at least 2 characters",
      );
      isValid = false;
    }

    if (formData.lastName.trim().length < 2) {
      newErrors.lastName = t(
        "personalInfoForm.validation.lastNameTooShort",
        "Last name must be at least 2 characters",
      );
      isValid = false;
    }

    if (!validator.isMobilePhone(formData.phone)) {
      newErrors.phone = t(
        "personalInfoForm.validation.invalidPhone",
        "Please enter a valid phone number",
      );
      isValid = false;
    }

    // Only validate credit card fields if kredietkaart payment method is selected
    if (formData.paymentMethod === "kredietkaart") {
      if (formData.creditCardName.trim().length < 3) {
        newErrors.creditCardName = t(
          "personalInfoForm.validation.cardholderNameRequired",
          "Please enter the cardholder name",
        );
        isValid = false;
      }

      if (!/^\d{2}\/\d{2}$/.test(formData.expiry)) {
        newErrors.expiry = t(
          "personalInfoForm.validation.expiryFormat",
          "Use MM/YY format",
        );
        isValid = false;
      } else {
        const [month, year] = formData.expiry.split("/").map(Number);
        const currentDate = new Date();
        const fullYear = 2000 + year;

        const expiryDate = new Date(fullYear, month, 0);
        expiryDate.setHours(23, 59, 59, 999);

        const maxDate = new Date(currentDate);
        maxDate.setFullYear(maxDate.getFullYear() + 5);

        if (month < 1 || month > 12) {
          newErrors.expiry = t(
            "personalInfoForm.validation.expiryMonthInvalid",
            "Month must be between 01 and 12",
          );
          isValid = false;
        } else if (expiryDate <= currentDate) {
          newErrors.expiry = t(
            "personalInfoForm.validation.cardExpired",
            "Card has expired",
          );
          isValid = false;
        } else if (expiryDate > maxDate) {
          newErrors.expiry = t(
            "personalInfoForm.validation.expiryTooFar",
            "Expiry date cannot be more than 5 years in the future",
          );
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const submitFormData = async (paymentTransactionId) => {
    try {
      const expiryParts = formDataRef.current.expiry.split("/");
      const formattedExpiry = `20${expiryParts[1]}-${expiryParts[0].padStart(
        2,
        "0",
      )}`;

      // Append bike rental note if checkbox is checked, geen vertaling nodig hier
      let finalNotes = formDataRef.current.notes;
      if (contactForBikeRental) {
        finalNotes = finalNotes
          ? `${finalNotes} | Contacteer ivm fietsverhuur`
          : "Contacteer ivm fietsverhuur";
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/reservations/book/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...bookingData,
            travelMode,
            personalInformation: {
              ...formDataRef.current,
              notes: finalNotes, // Use the potentially modified notes
            },
            paymentInfo: {
              method: formDataRef.current.paymentMethod, // Use ref here too for consistency
              transactionId: paymentTransactionId,
              expiry: formattedExpiry,
              holderName: formData.creditCardName,
            },
          }),
        },
      );

      if (response.ok) {
        setSubmissionSuccess(true);
      } else {
        const errorData = await response.json();
        setErrors((prev) => ({
          ...prev,
          general:
            errorData.message ||
            t(
              "personalInfoForm.error.bookingFailed",
              "An error occurred while booking.",
            ),
        }));
      }
    } catch (error) {
      console.error(error);
      setErrors((prev) => ({
        ...prev,
        general: t(
          "personalInfoForm.error.generalTryAgain",
          "An error occurred. Please try again later.",
        ),
      }));
    } finally {
      setIsSubmitting(false); // Ensure this is always called
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrors((prev) => ({
        ...prev,
        general: t(
          "personalInfoForm.error.formErrors",
          "There are errors in the form. Please check all fields.",
        ),
      }));
      return;
    }

    setIsSubmitting(true);

    if (formData.paymentMethod === "kredietkaart") {
      // For credit card payment, process through Datatrans
      if (secureFieldsRef.current) {
        const [month, year] = formData.expiry.split("/").map(Number);
        try {
          try {
            const submissionData = {
              expm: month.toString().padStart(2, "0"), // Ensure two digits with leading zero if needed
              expy: year.toString().padStart(2, "0"), // Ensure consistent format
              usage: "SIMPLE",
            };
            setTimeout(() => {
              try {
                secureFieldsRef.current.submit(submissionData);
              } catch (innerError) {
                setErrors((prev) => ({
                  ...prev,
                  general: t(
                    "personalInfoForm.error.paymentProcessingFailed",
                    "An error occurred while processing the payment.",
                  ),
                }));
                setIsSubmitting(false); // Ensure submitting state is reset on inner error
              }
            }, 100);
          } catch (error) {
            // console.error("Error submitting secure fields:", error);
            setErrors((prev) => ({
              ...prev,
              general: t(
                "personalInfoForm.error.paymentProcessingFailed",
                "An error occurred while processing the payment.",
              ),
            }));
            setIsSubmitting(false); // Ensure submitting state is reset on error
          }
          // The rest will be handled by the success callback
        } catch (error) {
          // console.error("Error submitting secure fields:", error);
          setErrors((prev) => ({
            ...prev,
            general: t(
              "personalInfoForm.error.paymentProcessingFailed",
              "An error occurred while processing the payment.",
            ),
          }));
          setIsSubmitting(false); // Ensure submitting state is reset on error
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          general: t(
            "personalInfoForm.error.paymentSystemNotInitialized",
            "Payment system is not initialized. Please refresh the page and try again.",
          ),
        }));
        setIsSubmitting(false); // Ensure submitting state is reset
      }
    } else {
      // For bank transfer, submit directly
      submitFormData(null);
    }
  };

  // Load Dutch country names
  countries.registerLocale(nlLocale);

  // Define common nationalities in Dutch
  const commonNationalities = [
    "België",
    "Nederland",
    "Duitsland",
    "Frankrijk",
    "Verenigd Koninkrijk",
    "Verenigde Staten",
    "Canada",
    "Spanje",
    "Italië",
  ];

  // Get all country names in Dutch
  const allCountriesObj = countries.getNames("nl");

  // Convert object to an array
  const allCountries = Object.values(allCountriesObj);

  // Filter out the common ones from the full list
  const remainingCountries = allCountries.filter(
    (country) => !commonNationalities.includes(country),
  );

  // Combine common ones at the top + sorted remaining countries
  const sortedRemainingCountries = remainingCountries
    .slice()
    .sort((a, b) => a.localeCompare(b));
  const nationalities = [...commonNationalities, ...sortedRemainingCountries];

  if (submissionSuccess) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="mb-4 flex justify-center items-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="green"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.59L19 8L10 17Z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-green-600 mb-4">
          {t("personalInfoForm.success.title", "Reservation successful!")}
        </h2>
        <p className="mb-4 text-lg">
          <strong>
            {t(
              "personalInfoForm.success.thankYou",
              "Thank you for your reservation!",
            )}
          </strong>
        </p>
        <p className="mb-4">
          {t(
            "personalInfoForm.success.confirmationNote",
            "Please note: you will receive a separate confirmation email for each hotel. This allows you to easily check which hotel you are staying at each night.",
          )}
        </p>

        {/* Flex container for buttons */}
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() =>
              (window.location.href = "https://www.corsendonkhotels.com")
            }
            className="w-full sm:w-auto bg-[#2C4A3C] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#2C4A3C]/90 transition-colors"
          >
            {t(
              "personalInfoForm.success.backToHomeButton",
              "Back to Corsendonk homepage",
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-6">
        {t("personalInfoForm.title", "Personal Information")}
      </h2>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("personalInfoForm.emailLabel", "Email")}{" "}
            <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className={`w-full border ${
              errors.email ? "border-red-500" : "border-gray-200"
            } rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]`}
            value={formData.email}
            onChange={handleChange}
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("personalInfoForm.firstNameLabel", "First Name")}{" "}
              <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              className={`w-full border ${
                errors.firstName ? "border-red-500" : "border-gray-200"
              } rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]`}
              value={formData.firstName}
              onChange={handleChange}
              aria-invalid={errors.firstName ? "true" : "false"}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("personalInfoForm.lastNameLabel", "Last Name")}{" "}
              <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              className={`w-full border ${
                errors.lastName ? "border-red-500" : "border-gray-200"
              } rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]`}
              value={formData.lastName}
              onChange={handleChange}
              aria-invalid={errors.lastName ? "true" : "false"}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("personalInfoForm.phoneLabel", "Phone Number")}{" "}
            <span className="text-red-600">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            className={`w-full border ${
              errors.phone ? "border-red-500" : "border-gray-200"
            } rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]`}
            value={formData.phone}
            onChange={handleChange}
            aria-invalid={errors.phone ? "true" : "false"}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="nationality"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("personalInfoForm.nationalityLabel", "Nationality")}{" "}
            <span className="text-red-600">*</span>
          </label>
          <select
            id="nationality"
            name="nationality"
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C] bg-white"
            value={formData.nationality}
            onChange={handleChange}
          >
            {nationalities.map((nationality) => (
              <option key={nationality} value={nationality}>
                {nationality}
              </option>
            ))}
          </select>
          {errors.nationality && (
            <p className="mt-1 text-sm text-red-600">{errors.nationality}</p>
          )}
        </div>
        {/* Payment Method Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("personalInfoForm.paymentMethodLabel", "Payment Method")}{" "}
            <span className="text-red-600">*</span>
          </label>
          <div className="flex sm:flex-row flex-col rounded-md overflow-hidden border border-gray-200">
            <button
              type="button"
              onClick={() => handlePaymentMethodChange("kredietkaart")}
              className={`flex-1 py-2.5 px-4 font-medium text-sm transition-colors ${
                formData.paymentMethod === "kredietkaart"
                  ? "bg-[#2C4A3C] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("personalInfoForm.paymentMethod.creditCard", "Credit Card")}
            </button>
            <button
              type="button"
              onClick={() => handlePaymentMethodChange("bankoverschrijving")}
              className={`flex-1 py-2.5 px-4 font-medium text-sm transition-colors ${
                formData.paymentMethod === "bankoverschrijving"
                  ? "bg-[#2C4A3C] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t(
                "personalInfoForm.paymentMethod.bankTransfer",
                "Bank Transfer",
              )}
            </button>
          </div>
        </div>

        {/* Conditional rendering for payment method details */}
        {formData.paymentMethod === "kredietkaart" ? (
          <>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                {t(
                  "personalInfoForm.creditCardGuaranteeNote",
                  "The credit card is only used as a guarantee or in case of late cancellation or no-show.",
                )}
              </p>
            </div>
            <div>
              <label
                htmlFor="creditCardName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("personalInfoForm.cardholderNameLabel", "Cardholder Name")}{" "}
                <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="creditCardName"
                name="creditCardName"
                required
                className={`w-full border ${
                  errors.creditCardName ? "border-red-500" : "border-gray-200"
                } rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]`}
                value={formData.creditCardName}
                onChange={handleChange}
                aria-invalid={errors.creditCardName ? "true" : "false"}
              />
              {errors.creditCardName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.creditCardName}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="creditCard"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("personalInfoForm.cardNumberLabel", "Credit Card Number")}{" "}
                <span className="text-red-600">*</span>
              </label>
              <div
                id="creditCard"
                ref={cardNumberPlaceholderRef}
                className={`w-full border ${
                  errors.creditCard ? "border-red-500" : "border-gray-200"
                } rounded-lg px-4 py-2.5 focus:outline-none`}
                style={{ height: "42px" }}
              ></div>
              {errors.creditCard && (
                <p className="mt-1 text-sm text-red-600">{errors.creditCard}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="expiry"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("personalInfoForm.expiryDateLabel", "Expiry Date (MM/YY)")}{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="expiry"
                  name="expiry"
                  required
                  placeholder={t("personalInfoForm.expiryPlaceholder", "MM/YY")}
                  className={`w-full border ${
                    errors.expiry ? "border-red-500" : "border-gray-200"
                  } rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]`}
                  value={formData.expiry}
                  onChange={handleExpiryChange}
                  aria-invalid={errors.expiry ? "true" : "false"}
                  maxLength={5}
                />
                {errors.expiry && (
                  <p className="mt-1 text-sm text-red-600">{errors.expiry}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="cvc"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("personalInfoForm.cvcLabel", "CVC/CVV")}{" "}
                  <span className="text-red-600">*</span>
                </label>
                <div
                  id="cvc"
                  ref={cvvPlaceholderRef}
                  className={`w-full border ${
                    errors.cvc ? "border-red-500" : "border-gray-200"
                  } rounded-lg px-4 py-2.5 focus:outline-none`}
                  style={{ height: "42px" }}
                ></div>
                {errors.cvc && (
                  <p className="mt-1 text-sm text-red-600">{errors.cvc}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              {t(
                "personalInfoForm.bankTransferInfoNote",
                "You will receive a confirmation email with our bank account number. We request payment within 5 days of making the reservation to confirm it.",
              )}
            </p>
          </div>
        )}

        <div className="mt-4">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
          >
            {t("personalInfoForm.extraNotesLabel", "Extra Notes")}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="center"
                  className="max-w-xs z-50 bg-white shadow-lg"
                >
                  <p className="text-sm text-gray-500">
                    {t(
                      "personalInfoForm.extraNotesTooltip",
                      "You can enter extra comments or special requests here, or mention if you are a member of an association.",
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder={t(
              "personalInfoForm.extraNotesPlaceholder",
              "Enter extra notes here",
            )}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none shadow-none"
          />
        </div>

        {/* Fietsverhuur Section*/}
        {travelMode === "cycling" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("personalInfoForm.bikeRentalLabel", "Bike Rental?")}
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="contactForBikeRental"
                name="contactForBikeRental"
                checked={contactForBikeRental}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-[#2C4A3C] focus:ring-[#2C4A3C] border-gray-300 rounded"
              />
              <label
                htmlFor="contactForBikeRental"
                className="ml-2 block text-sm text-gray-900"
              >
                {t(
                  "personalInfoForm.bikeRentalCheckbox",
                  "Contact me regarding bike rental",
                )}
              </label>
            </div>
          </div>
        )}
        <div className="mt-4 text-sm text-gray-900">
          {t(
            "personalInfoForm.acceptTermsLabelBeforeLink",
            "By pressing the confirm button, you accept",
          )}{" "}
          <a
            href={t("personalInfoForm.generalConditionsLinkUrl", {
              defaultValue:
                "https://corsendonkhotels.com/en/sales-conditions-and-privacy/",
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2C4A3C] underline hover:text-[#2C4A3C]/90"
          >
            {t("personalInfoForm.generalConditionsLink", "General Conditions")}
          </a>
          {t(
            "personalInfoForm.acceptTermsLabelAfterLink",
            " of the reservation",
          )}{" "}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full ${
            isSubmitting ? "bg-gray-400" : "bg-[#2C4A3C] hover:bg-[#2C4A3C]/90"
          } text-white px-8 py-3 rounded-lg font-medium transition-colors mt-6 flex justify-center items-center`}
          onClick={handleSubmit}
        >
          {isSubmitting
            ? t("common.processing", "Processing...")
            : t(
                "personalInfoForm.confirmReservationButton",
                "Confirm Reservation",
              )}
        </button>
      </form>
    </div>
  );
}
