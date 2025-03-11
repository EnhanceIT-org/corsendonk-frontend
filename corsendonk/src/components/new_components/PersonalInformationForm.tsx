import React, { useState } from "react";
import validator from "validator";

export function PersonalInformationForm({ bookingData, travelMode }) {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    nationality: "",
    creditCard: "",
    cvc: "",
    expiry: "",
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(
      JSON.stringify({
        ...bookingData,
        personalInformation: formData,
      }),
    );
    try {
      const response = await fetch("http://localhost:8000/reservations/book/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...bookingData,
          travelMode: travelMode,
          personalInformation: formData,
        }),
      });
      if (response.ok) {
        console.log("Booking successful!");
      } else {
        const error = await response.json();
        setErrorMessage(error.message);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong. Please try again later.");
    }
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  const [errorMessage, setErrorMessage] = useState("");

  const validateCreditCard = (value) => {
    if (validator.isCreditCard(value)) {
      setFormData({ ...formData, creditCard: value });
    } else {
      setErrorMessage("Krediet-kaart nummer niet geldig");
    }
  };
  const validateCvc = (value) => {
    if (value.length === 3 && /^\d+$/.test(value)) {
      setFormData({ ...formData, cvc: value });
    } else {
      setErrorMessage("CVC-nummer is niet geldig");
    }
  };

  const validateExpiry = (value) => {
    const [month, year] = value.split("/").map(Number);
    const currentDate = new Date();
    let error = false;

    const fullYear = year < 100 ? 2000 + year : year;
    const expiryDate = new Date(fullYear, month - 1, 1);

    const maxDate = new Date(currentDate);
    maxDate.setFullYear(maxDate.getFullYear() + 5);

    if (expiryDate > maxDate) {
      error = true;
    }

    if (
      value.length === 5 &&
      /^\d{2}\/\d{2}$/.test(value) &&
      expiryDate > currentDate &&
      month >= 1 &&
      month <= 12 &&
      !error
    ) {
      setFormData({ ...formData, expiry: value });
    } else {
      setErrorMessage(
        "Vervaldatum is niet geldig of is in het verleden of ligt meer dan 5 jaar in toekomst",
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-6">Personal Information</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <span
          style={{
            fontWeight: "bold",
            color: "red",
          }}
        >
          {errorMessage}
        </span>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Voornaam
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Achternaam
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Telefoonnummer
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div>
          <label
            htmlFor="credit"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            KredietKaart
          </label>
          <input
            type="text"
            id="credit"
            name="credit"
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]"
            value={formData.creditCard}
            onChange={(e) => {
              validateCreditCard(e.target.value);
            }}
          />
        </div>
        <div>
          <label
            htmlFor="cvc"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Cvc
          </label>
          <input
            type="text"
            id="cvc"
            name="cvc"
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]"
            value={formData.cvc}
            onChange={(e) => {
              validateCvc(e.target.value);
            }}
          />
        </div>
        <div>
          <label
            htmlFor="expiry Date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Vervaldatum (MM/JJ)
          </label>
          <input
            type="text"
            id="expiry Date"
            name="expiry Date"
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C]"
            value={formData.expiry}
            onChange={(e) => {
              validateExpiry(e.target.value);
            }}
          />
        </div>
        <div>
          <label
            htmlFor="nationality"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nationaliteit
          </label>
          <select
            id="nationality"
            name="nationality"
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#2C4A3C] bg-white"
            value={formData.nationality}
            onChange={handleChange}
          >
            {/* todo */}
            <option>Belg</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-[#2C4A3C] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2C4A3C]/90 transition-colors mt-6"
        >
          Bevestig Reservatie
        </button>
      </form>
    </div>
  );
}
