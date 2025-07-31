import React, { useState } from "react";
import { useTranslation } from 'react-i18next'; // Import hook
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface RoomDetailModalProps {
  room: {
    category_id: string;
    category_name: string; 
    hotel: string;
  };
  rawConfig: any;
  onClose: () => void;
}

// Map i18next language codes to the codes used in rawConfig
const langCodeMapping: { [key: string]: string } = {
  en: 'en-GB',
  nl: 'nl-NL',
  fr: 'fr-FR', // Assuming fr-FR is used in rawConfig, adjust if needed
};

function getCategoryDetails(hotel: string, categoryId: string, config: any, currentLang: string) {
  const { t } = useTranslation(); // Use hook inside function if needed, or pass t as arg
  // Default values using translation keys
  let name = t('roomDetailModal.unknownRoom', 'Unknown Room');
  let imageUrls: string[] = [];
  let description = t('roomDetailModal.descriptionUnavailable', 'Description not available.');

  if (
    config &&
    config[hotel] &&
    config[hotel].rawConfig &&
    config[hotel].rawConfig.Configurations &&
    config[hotel].rawConfig.Configurations.length > 0
  ) {
    const raw = config[hotel].rawConfig;
    const imageBaseUrl = raw.ImageBaseUrl;
    const enterprise = raw.Configurations[0]?.Enterprise;
    const categories = enterprise?.Categories || [];

    const category = categories.find((cat: any) => cat.Id === categoryId);

    if (category) {
      const currentLangCode = langCodeMapping[currentLang] || 'nl-NL'; // Default to nl-NL if mapping fails
      const fallbackLangCodeEn = 'en-GB';
      const fallbackLangCodeNl = 'nl-NL';

      // Fallback logic for name
      name = category.Name?.[currentLangCode] || category.Name?.[fallbackLangCodeEn] || category.Name?.[fallbackLangCodeNl] || name;

      // Get image URLs (no change needed here)
      imageUrls =
        category.ImageIds && category.ImageIds.length > 0
          ? category.ImageIds.map((imgId: string) => `${imageBaseUrl}/${imgId}`)
          : [];

      // Fallback logic for description
      description = category.Description?.[currentLangCode] || category.Description?.[fallbackLangCodeEn] || category.Description?.[fallbackLangCodeNl] || description;

    }
  }
  // Return name, imageUrls, and the description
  return { name, imageUrls, description };
}

export function RoomDetailModal({
  room,
  rawConfig,
  onClose,
}: RoomDetailModalProps) {
  const { t, i18n } = useTranslation(); // Instantiate hook
  // Destructure name, imageUrls, AND description from the helper function
  // Pass the current language to the helper
  const { name, imageUrls, description } = getCategoryDetails(
    room.hotel,
    room.category_id,
    rawConfig,
    i18n.language, // Pass current language
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(-1);
  };

  const showPrevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? imageUrls.length - 1 : prev - 1,
    );
  };

  const showNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === imageUrls.length - 1 ? 0 : prev + 1,
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              {/* Use the dynamically fetched 'name' for the title */}
              <h3 className="text-xl font-semibold text-[#2C4A3C]">
                {name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
              title={t('common.closeModal', 'Close Modal')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6">
             
             {imageUrls.length > 0 ? (
              imageUrls.map((url: string, idx: number) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Room view ${idx + 1}`}
                  className="rounded-lg w-full cursor-pointer object-cover max-h-64" // Added object-cover and max-height
                  onClick={() => openLightbox(idx)}
                />
              ))
            ) : (
              <img
                src={`https://placehold.co/400x300?text=${t('roomDetailModal.noImagePlaceholder', 'No+Image')}`} // Use translated placeholder text
                alt={t('roomDetailModal.noImageAlt', 'No image available')}
                className="rounded-lg w-full"
              />
            )}
          </div>

          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 text-[#2C4A3C]">{t('roomDetailModal.descriptionTitle', 'Description')}</h4>
              {/* Display the fetched description */}
              <p className="text-gray-600 whitespace-pre-wrap">{description}</p>
            </div>
            
          </div>
        </div>
      </div>

      
      {selectedImageIndex >= 0 && imageUrls.length > 0 && (
         <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
           <div
             className="absolute inset-0"
             onClick={closeLightbox}
             title={t('common.closeLightbox', 'Close Lightbox')}
           ></div>
           <div className="relative z-10 max-w-4xl w-full max-h-full flex flex-col items-center">
             <img
               src={imageUrls[selectedImageIndex]}
               alt={`Enlarged ${selectedImageIndex + 1}`}
               className="rounded-lg max-h-[80vh] object-contain"
             />
             <button
               onClick={closeLightbox}
               className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
               title={t('common.close', 'Close')}
             >
               <X className="w-5 h-5" />
             </button>
             {imageUrls.length > 1 && (
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   showPrevImage();
                 }}
                 className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                 title={t('common.previous', 'Previous')}
               >
                 <ChevronLeft className="w-5 h-5" />
               </button>
             )}
             {imageUrls.length > 1 && (
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   showNextImage();
                 }}
                 className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                 title={t('common.next', 'Next')}
               >
                 <ChevronRight className="w-5 h-5" />
               </button>
             )}
           </div>
         </div>
       )}
    </div>
  );
}
