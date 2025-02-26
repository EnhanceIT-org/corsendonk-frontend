import React from "react";
import { X } from "lucide-react";

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

export function RoomDetailModal({ room, rawConfig, onClose }: RoomDetailModalProps) {
  const { name, imageUrls } = getCategoryDetails(room.hotel, room.category_id, rawConfig);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-[#2C4A3C]">
                {room.category_name}
              </h3>
              <p className="text-gray-500">{name}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {imageUrls.length > 0 ? (
              imageUrls.map((url: string, idx: number) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Room view ${idx + 1}`}
                  className="rounded-lg w-full"
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
    </div>
  );
}
