import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Helper to get the button label from translation files
  const getButtonLabel = (langCode: string) => {
    switch (langCode) {
      case 'nl':
        return t('languageSwitcher.nl', 'Nederlands'); // Fallback added
      case 'en':
        return t('languageSwitcher.en', 'English');    // Fallback added
      case 'fr':
        return t('languageSwitcher.fr', 'Français');   // Fallback added
      default:
        return langCode.toUpperCase();
    }
  };

  // Ensure supportedLngs is an array and filter out 'cimode'
  const supportedLanguages = (i18n.options.supportedLngs || [])
    .filter((lng): lng is string => typeof lng === 'string' && lng !== 'cimode');

  return (
    // Added pt-3 (padding-top: 0.75rem) and pl-3 (padding-left: 0.75rem)
    <div className="flex items-center space-x-1 sm:space-x-2 pt-3 pl-3">
      {supportedLanguages.map((lng) => (
        <button
          key={lng}
          type="button"
          className={`
            px-3 py-1 text-xs sm:text-sm rounded-lg border transition-colors duration-150 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#2C4A3C]
            ${
              i18n.resolvedLanguage === lng
                ? 'bg-[#2C4A3C] text-white border-[#2C4A3C] font-medium' // Active state
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#2C4A3C] dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-[#2C4A3C]' // Inactive state
            }
          `}
          onClick={() => changeLanguage(lng)}
          disabled={i18n.resolvedLanguage === lng}
          aria-pressed={i18n.resolvedLanguage === lng}
          // Using a more generic aria-label if specific translation for "Change language to X" isn't available.
          // The button text itself (e.g., "English") is quite descriptive.
          aria-label={`${t('languageSwitcher.title', 'Select Language')}: ${getButtonLabel(lng)}`}
        >
          {getButtonLabel(lng)}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;