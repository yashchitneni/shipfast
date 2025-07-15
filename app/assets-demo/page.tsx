import { AssetManager } from '../components/assets/AssetManager';

export default function AssetsDemoPage() {
  return (
    <div className="min-h-screen bg-gray-200">
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-4">Flexport Asset System Demo</h1>
        <p className="mb-4">
          This is a demonstration of the asset placement system. Select assets from the right panel
          and click on the map to place them. Assets will snap to nearby ports.
        </p>
        
        {/* Mock map area */}
        <div className="relative bg-blue-100 rounded-lg" style={{ height: '600px' }}>
          {/* Mock port indicators */}
          <div className="absolute" style={{ left: '100px', top: '200px' }}>
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
              🚢
            </div>
            <p className="text-xs mt-1">Oakland</p>
          </div>
          
          <div className="absolute" style={{ left: '800px', top: '300px' }}>
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
              🚢
            </div>
            <p className="text-xs mt-1">Shanghai</p>
          </div>
          
          <div className="absolute" style={{ left: '450px', top: '150px' }}>
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
              🚢
            </div>
            <p className="text-xs mt-1">Rotterdam</p>
          </div>
          
          <div className="absolute" style={{ left: '750px', top: '450px' }}>
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
              🚢
            </div>
            <p className="text-xs mt-1">Singapore</p>
          </div>
          
          <div className="absolute" style={{ left: '50px', top: '350px' }}>
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
              🚢
            </div>
            <p className="text-xs mt-1">Los Angeles</p>
          </div>
        </div>
      </div>
      
      {/* Asset Manager handles the placement UI and preview */}
      <AssetManager />
    </div>
  );
}