'use client';

import { useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';

interface VitalsFormData {
  horseId: string;
  temperatureC: string;
  heartRateBpm: string;
}

export default function VitalsQuickEntry() {
  const [formData, setFormData] = useState<VitalsFormData>({
    horseId: '',
    temperatureC: '',
    heartRateBpm: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      // Prepare the data for the API
      const vitalsData = {
        horseId: formData.horseId.trim(),
        temperatureC: formData.temperatureC ? parseFloat(formData.temperatureC) : null,
        heartRateBpm: formData.heartRateBpm ? parseInt(formData.heartRateBpm, 10) : null,
        source: 'manual' as const,
        when: new Date().toISOString(),
      };

      const response = await fetch(`${apiUrl}/vitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vitalsData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save vitals');
      }

      // Success - clear form and show toast
      setFormData({
        horseId: '',
        temperatureC: '',
        heartRateBpm: '',
      });
      
      toast.success('Vitals saved successfully!', {
        duration: 3000,
        position: 'top-center',
      });
    } catch (error) {
      console.error('Error saving vitals:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save vitals',
        {
          duration: 4000,
          position: 'top-center',
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster />
      
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Vitals Quick Entry
            </h1>
            <p className="text-gray-600 text-sm mb-4">
              Record horse vitals quickly and easily
            </p>
            <a
              href="/dose-tasks"
              className="inline-block px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              View Dose Tasks →
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Horse ID Input */}
            <div>
              <label 
                htmlFor="horseId" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Horse ID *
              </label>
              <input
                type="text"
                id="horseId"
                name="horseId"
                value={formData.horseId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder="Enter horse ID"
              />
            </div>

            {/* Temperature Input */}
            <div>
              <label 
                htmlFor="temperatureC" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Temperature (°C)
              </label>
              <input
                type="number"
                id="temperatureC"
                name="temperatureC"
                value={formData.temperatureC}
                onChange={handleInputChange}
                step="0.1"
                min="30"
                max="45"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder="37.5"
              />
            </div>

            {/* Heart Rate Input */}
            <div>
              <label 
                htmlFor="heartRateBpm" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                id="heartRateBpm"
                name="heartRateBpm"
                value={formData.heartRateBpm}
                onChange={handleInputChange}
                min="20"
                max="200"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder="60"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.horseId.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Vitals'
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>All fields except Horse ID are optional</p>
            <p>Data will be saved with current timestamp</p>
          </div>
        </div>
      </div>
    </div>
  );
}