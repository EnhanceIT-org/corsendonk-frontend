import React from "react";
export function OptionalExtras() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Optional Extras
      </h3>
      <div className="space-y-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" className="rounded border-gray-300" />
          <div>
            <div className="font-medium">Lunch Package</div>
            <div className="text-sm text-gray-500">€15 per person per day</div>
          </div>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="rounded border-gray-300" />
          <div>
            <div className="font-medium">Bicycle Rental</div>
            <div className="text-sm text-gray-500">€25 per person per day</div>
          </div>
        </label>
      </div>
    </div>
  );
}
