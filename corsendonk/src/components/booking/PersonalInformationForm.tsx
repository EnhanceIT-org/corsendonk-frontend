import React, { useState, useEffect } from "react";
import validator from "validator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import countries from "i18n-iso-countries";
import nlLocale from "i18n-iso-countries/langs/nl.json";

export function PersonalInformationForm({ bookingData, travelMode }) {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    nationality: "België",
    paymentMethod: "kredietkaart", // New field for payment method
    creditCardName: "",
    creditCard: "",
    cvc: "",
    expiry: "",
    notes: "",
  });

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

  const handlePaymentMethodChange = (method) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  };

  const handleCreditCardChange = (e) => {
    const value = e.target.value.replace(/\s/g, "");
    setFormData((prev) => ({
      ...prev,
      creditCard: value,
    }));
    clearError("creditCard");
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
    const newErrors = { ...errors };

    if (!validator.isEmail(formData.email)) {
      newErrors.email = "Voer een geldig e-mailadres in";
      isValid = false;
    }

    if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "Voornaam moet minimaal 2 tekens bevatten";
      isValid = false;
    }

    if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Achternaam moet minimaal 2 tekens bevatten";
      isValid = false;
    }

    if (!validator.isMobilePhone(formData.phone)) {
      newErrors.phone = "Voer een geldig telefoonnummer in";
      isValid = false;
    }

    // Only validate credit card fields if kredietkaart payment method is selected
    if (formData.paymentMethod === "kredietkaart") {
      if (!validator.isCreditCard(formData.creditCard)) {
        newErrors.creditCard = "Kredietkaart nummer is niet geldig";
        isValid = false;
      }

      if (!/^\d{3,4}$/.test(formData.cvc)) {
        newErrors.cvc = "CVC moet 3 of 4 cijfers bevatten";
        isValid = false;
      }

      if (!/^\d{2}\/\d{2}$/.test(formData.expiry)) {
        newErrors.expiry = "Gebruik formaat MM/JJ";
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
          newErrors.expiry = "Maand moet tussen 01 en 12 liggen";
          isValid = false;
        } else if (expiryDate <= currentDate) {
          newErrors.expiry = "Kaart is verlopen";
          isValid = false;
        } else if (expiryDate > maxDate) {
          newErrors.expiry =
            "Vervaldatum mag niet meer dan 5 jaar in de toekomst liggen";
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrors((prev) => ({
        ...prev,
        general: "Er zijn fouten in het formulier. Controleer alle velden.",
      }));
      return;
    }

    setIsSubmitting(true);

    try {
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
            personalInformation: formData,
          }),
        },
      );

      if (response.ok) {
        setSubmissionSuccess(true);
        console.log("Booking successful!");
      } else {
        const errorData = await response.json();
        setErrors((prev) => ({
          ...prev,
          general:
            errorData.message || "Er is een fout opgetreden bij het boeken.",
        }));
      }
    } catch (error) {
      console.error(error);
      setErrors((prev) => ({
        ...prev,
        general: "Er is een fout opgetreden. Probeer het later opnieuw.",
      }));
    } finally {
      setIsSubmitting(false);
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
  const nationalities = [...commonNationalities, ...remainingCountries.sort()];

  if (submissionSuccess) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        {/* <span style={{ fontSize: "48px", color: "green" }}>✔</span> */}
        <div className="mb-4 flex justify-center items-center">
          {/* SVG icon */}
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
          Reservering succesvol!
        </h2>
        <p className="mb-4 text-lg">
          <strong>Bedankt voor uw reservering!</strong>
        </p>
        <p className="mb-4">Uw boeking is succesvol bevestigd.</p>
        <p className="mb-4">
          U ontvangt spoedig een e-mail met alle nodige informatie.
        </p>

        {/* Flex container for buttons */}
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full sm:w-auto bg-[#2C4A3C] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#2C4A3C]/90 transition-colors"
          >
            Terug naar homepagina
          </button>

          <button
            onClick={() =>
              (window.location.href = "https://www.corsendonkhotels.com")
            }
            className="w-full sm:w-auto bg-[#2C4A3C] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#2C4A3C]/90 transition-colors"
          >
            Terug naar Corsendonk homepagina
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-6">Persoonlijke Informatie</h2>

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
            Email <span className="text-red-600">*</span>
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
              Voornaam <span className="text-red-600">*</span>
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
              Achternaam <span className="text-red-600">*</span>
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
            Telefoonnummer <span className="text-red-600">*</span>
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
            Nationaliteit <span className="text-red-600">*</span>
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
            Betaalmethode <span className="text-red-600">*</span>
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
              Kredietkaart
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
              Bankoverschrijving
            </button>
          </div>
        </div>

        {/* Conditional rendering for payment method details */}
        {formData.paymentMethod === "kredietkaart" ? (
          <>
            <div>
              <label
                htmlFor="creditCardName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Naam van de kaarthouder <span className="text-red-600">*</span>
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
                Kredietkaart nummer <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="creditCard"
                name="creditCard"
                required
                placeholder="XXXX XXXX XXXX XXXX"
                className={`w-full border ${
                  errors.creditCard ? "border-red-500" : "border-gray-200"
                } rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]`}
                value={formData.creditCard}
                onChange={handleCreditCardChange}
                aria-invalid={errors.creditCard ? "true" : "false"}
                maxLength={19}
              />
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
                  Vervaldatum (MM/JJ) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="expiry"
                  name="expiry"
                  required
                  placeholder="MM/JJ"
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
                  CVC/CVV <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="cvc"
                  name="cvc"
                  required
                  placeholder="3 of 4 cijfers"
                  className={`w-full border ${
                    errors.cvc ? "border-red-500" : "border-gray-200"
                  } rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]`}
                  value={formData.cvc}
                  onChange={handleChange}
                  aria-invalid={errors.cvc ? "true" : "false"}
                  maxLength={4}
                />
                {errors.cvc && (
                  <p className="mt-1 text-sm text-red-600">{errors.cvc}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              U ontvangt een bevestingsmail met ons rekeningnummer, we vragen
              een betaling binnen de 5 dagen na het maken van de reservering om
              de reservatie te bevestigen.
            </p>
          </div>
        )}

        <div className="mt-4">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
          >
            Extra Notities
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
                    U kunt hier extra opmerkingen of speciale verzoeken
                    invoeren, of vermelden indien u lid bent van een vereniging.
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
            placeholder="Voer hier extra notities in"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none shadow-none"
          />
        </div>

        <div className="mt-2 text-sm text-gray-500">
          <p>
            Velden met <span className="text-red-600">*</span> zijn verplicht
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full ${
            isSubmitting ? "bg-gray-400" : "bg-[#2C4A3C] hover:bg-[#2C4A3C]/90"
          } text-white px-8 py-3 rounded-lg font-medium transition-colors mt-6 flex justify-center items-center`}
        >
          {isSubmitting ? "Bezig met verwerken..." : "Bevestig Reservatie"}
        </button>
      </form>
    </div>
  );
}
