import { useState } from 'react';

const WhyAnalysis = () => {
  const [whys, setWhys] = useState<string[]>(['', '', '', '', '']);

  const handleWhyChange = (index: number, value: string) => {
    const newWhys = [...whys];
    newWhys[index] = value;
    setWhys(newWhys);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">5 Whys Analysis</h3>
        <p className="text-gray-500 mb-4">Drill down to the root cause by asking "Why?" five times.</p>
        
        <div className="space-y-4">
          {whys.map((why, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                {index + 1}
              </div>
              <div className="flex-grow">
                <label htmlFor={`why-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Why?
                </label>
                <input
                  type="text"
                  id={`why-${index}`}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  placeholder={index === 0 ? "Why did the problem occur?" : "Why did that happen?"}
                  value={why}
                  onChange={(e) => handleWhyChange(index, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="font-medium text-green-900 mb-2">Root Cause</h4>
          <p className="text-green-800">
            {whys[4] ? whys[4] : "Complete the 5 whys to identify the root cause."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhyAnalysis;
