import React from 'react';
import { useEmpireStore } from '../store/empireStore';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Component that displays a notice when legacy assets need migration
 * and provides a button to perform the migration.
 */
export const AssetMigrationNotice: React.FC = () => {
  const { isLegacyDataPresent, migrateLegacyAssets } = useEmpireStore();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isMigrating, setIsMigrating] = React.useState(false);

  React.useEffect(() => {
    // Check for legacy data on mount and periodically
    const checkLegacyData = () => {
      const hasLegacy = isLegacyDataPresent();
      setIsVisible(hasLegacy);
    };

    checkLegacyData();
    const interval = setInterval(checkLegacyData, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isLegacyDataPresent]);

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      // Perform migration
      migrateLegacyAssets();
      
      // Give a brief delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Hide the notice
      setIsVisible(false);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg z-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-800 mb-1">
            Asset Structure Update Available
          </h3>
          <p className="text-sm text-yellow-700 mb-3">
            We've detected assets using the legacy storage format. 
            Click below to migrate them to the new, more efficient structure.
          </p>
          <button
            onClick={handleMigration}
            disabled={isMigrating}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
              transition-colors duration-200
              ${isMigrating 
                ? 'bg-yellow-100 text-yellow-600 cursor-not-allowed' 
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }
            `}
          >
            {isMigrating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Migrate Assets
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetMigrationNotice;