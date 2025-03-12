import React, { useState } from "react";
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

function getCategoryDetails(hotel: string, categoryId: string, config: any) {
  if (
    config &&
    config[hotel] &&
    config[hotel].rawConfig &&
    config[hotel].rawConfig.Configurations &&
    config[hotel].rawConfig.Configurations.length > 0
  ) {
    const raw = config[hotel].rawConfig;
    const imageBaseUrl = raw.ImageBaseUrl;
    const categories = raw.Configurations[0].Enterprise.Categories || [];
    const category = categories.find((cat: any) => cat.Id === categoryId);
    if (category) {
      const name = category.Name["en-GB"] || "Unknown";
      const imageUrls =
        category.ImageIds && category.ImageIds.length > 0
          ? category.ImageIds.map((imgId: string) => `${imageBaseUrl}/${imgId}`)
          : [];
      return { name, imageUrls };
    }
  }
  return { name: "Unknown", imageUrls: [] };
}

export function RoomDetailModal({
  room,
  rawConfig,
  onClose,
}: RoomDetailModalProps) {
  const { name, imageUrls } = getCategoryDetails(
    room.hotel,
    room.category_id,
    rawConfig,
  );

  // ADDED: Lightbox state for displaying one large image
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);

  // ADDED: Helper functions to open, navigate, close
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
      {/* Main content container */}
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <div className="p-6">
          {/* Modal header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-[#2C4A3C]">
                {room.category_name}
              </h3>
              <p className="text-gray-500">{name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
              title="Close Modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Image grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {imageUrls.length > 0 ? (
              imageUrls.map((url: string, idx: number) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Room view ${idx + 1}`}
                  className="rounded-lg w-full cursor-pointer"
                  onClick={() => openLightbox(idx)} // ADDED: open lightbox on click
                />
              ))
            ) : (
              <img
                src="https://placehold.co/400x300?text=No+Image"
                alt="No image available"
                className="rounded-lg w-full"
              />
            )}
          </div>

          {/* Room details below images */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 text-[#2C4A3C]">Room Features</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>King-size bed</li>
                <li>City view</li>
                <li>Free Wi-Fi</li>
                <li>Air conditioning</li>
                <li>Mini bar</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-[#2C4A3C]">Room Size</h4>
              <p className="text-gray-600">35 m²</p>
            </div>
          </div>
        </div>
      </div>

      {/* ADDED: Lightbox overlay if selectedImageIndex >= 0 */}
      {selectedImageIndex >= 0 && imageUrls.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          {/* Clicking on the dark area also closes the lightbox, optionally */}
          <div
            className="absolute inset-0"
            onClick={closeLightbox}
            title="Close Lightbox"
          ></div>

          {/* Container for the large image & controls */}
          <div className="relative z-10 max-w-4xl w-full max-h-full flex flex-col items-center">
            {/* Large image */}
            <img
              src={imageUrls[selectedImageIndex]}
              alt={`Enlarged ${selectedImageIndex + 1}`}
              className="rounded-lg max-h-[80vh] object-contain"
            />

            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Prev button */}
            {imageUrls.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showPrevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                title="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Next button */}
            {imageUrls.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showNextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                title="Next"
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
