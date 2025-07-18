'use client'

import { useEffect, useRef } from 'react'
import { useState } from 'react'

export default function TestSpritesPage() {
  const [zoomLevel, setZoomLevel] = useState(0.15)
  const [showingSprites, setShowingSprites] = useState(false)
  const zoomRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Update the display based on zoom threshold
    setShowingSprites(zoomLevel >= 0.5)
  }, [zoomLevel])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sprite System Test</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Zoom Control</h2>
          <div className="flex items-center space-x-4">
            <label htmlFor="zoom">Zoom Level:</label>
            <input
              ref={zoomRef}
              type="range"
              id="zoom"
              min="0.1"
              max="2.0"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono w-16 text-right">{zoomLevel.toFixed(1)}x</span>
          </div>
          <div className="mt-4">
            <p className="text-sm">
              Sprite Visibility Threshold: <span className="font-mono">0.5x</span>
            </p>
            <p className="mt-2">
              Status: {showingSprites ? (
                <span className="text-green-400">🟢 Sprites visible (zoomed in)</span>
              ) : (
                <span className="text-yellow-400">🟡 Grid only (zoomed out)</span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Land Sprite</h3>
            <div className="bg-gray-700 p-4 rounded">
              <img 
                src="/assets/sprites/land.png" 
                alt="Land sprite"
                className={`w-full h-auto transition-opacity duration-300 ${showingSprites ? 'opacity-100' : 'opacity-30'}`}
              />
            </div>
            <p className="text-sm mt-2 text-gray-400">
              Used for coastal areas adjacent to ports
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Crane Sprite</h3>
            <div className="bg-gray-700 p-4 rounded">
              <img 
                src="/assets/sprites/crane.png" 
                alt="Crane sprite"
                className={`w-full h-auto transition-opacity duration-300 ${showingSprites ? 'opacity-100' : 'opacity-30'}`}
              />
            </div>
            <p className="text-sm mt-2 text-gray-400">
              Used for port locations (2x2 tile coverage)
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Container Sprites</h3>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="bg-gray-700 p-4 rounded">
                <img 
                  src={`/assets/sprites/containers_${num}.png`} 
                  alt={`Container variation ${num}`}
                  className={`w-full h-auto transition-opacity duration-300 ${showingSprites ? 'opacity-100' : 'opacity-30'}`}
                />
                <p className="text-xs text-center mt-2">Variation {num}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-900 rounded-lg p-4 mt-8">
          <h3 className="text-lg font-semibold mb-2">How it works:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>When zoom level is below 0.5x, only the grid is visible (world map view)</li>
            <li>When zoom level reaches 0.5x or higher, detailed sprites appear</li>
            <li>Grid becomes semi-transparent when sprites are shown</li>
            <li>Sprites are dynamically loaded only for visible areas (performance optimization)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}