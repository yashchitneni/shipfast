import { EconomyDashboard, RouteProfitCalculator } from '@/components/economy';

export default function EconomyDemoPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Flexport Economy System Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <EconomyDashboard />
          </div>
          <div>
            <RouteProfitCalculator />
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-gray-900 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Economy System Features</h2>
          <ul className="space-y-2 text-gray-300">
            <li>✅ Dynamic market pricing based on supply/demand</li>
            <li>✅ Profit calculations with multiple modifiers</li>
            <li>✅ Asset efficiency and specialist bonuses</li>
            <li>✅ Market conditions (boom, normal, recession, crisis)</li>
            <li>✅ Financial tracking and credit rating system</li>
            <li>✅ Loan management with interest rates</li>
            <li>✅ Compounding growth calculations</li>
            <li>✅ Disaster penalties and risk management</li>
            <li>✅ Persistent state management with Zustand</li>
          </ul>
        </div>
      </div>
    </div>
  );
}