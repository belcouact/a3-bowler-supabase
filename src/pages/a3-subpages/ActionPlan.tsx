import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface ActionItem {
  id: number;
  task: string;
  owner: string;
  dueDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
}

const ActionPlan = () => {
  const [actions, setActions] = useState<ActionItem[]>([
    { id: 1, task: 'Update standard operating procedure', owner: 'Alice', dueDate: '2023-11-15', status: 'In Progress' },
  ]);

  const addAction = () => {
    const newAction: ActionItem = {
      id: Date.now(),
      task: '',
      owner: '',
      dueDate: '',
      status: 'Not Started',
    };
    setActions([...actions, newAction]);
  };

  const updateAction = (id: number, field: keyof ActionItem, value: string) => {
    setActions(actions.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeAction = (id: number) => {
    setActions(actions.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Action Plan</h3>
          <p className="text-gray-500">Define countermeasures to address the root cause.</p>
        </div>
        <button
          onClick={addAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Action
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Delete</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {actions.map((action) => (
              <tr key={action.id}>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={action.task}
                    onChange={(e) => updateAction(action.id, 'task', e.target.value)}
                    placeholder="Task description"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={action.owner}
                    onChange={(e) => updateAction(action.id, 'owner', e.target.value)}
                    placeholder="Owner"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="date"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={action.dueDate}
                    onChange={(e) => updateAction(action.id, 'dueDate', e.target.value)}
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={action.status}
                    onChange={(e) => updateAction(action.id, 'status', e.target.value as any)}
                  >
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => removeAction(action.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActionPlan;
