'use client';

import { useState, useRef } from 'react';
import { useDoseTasks, type DoseTask, type MarkGivenPayload } from '@/lib/useDoseTasks';

interface MarkGivenModalProps {
  task: DoseTask | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkGiven: (taskId: string, payload: MarkGivenPayload) => void;
}

function MarkGivenModal({ task, isOpen, onClose, onMarkGiven }: MarkGivenModalProps) {
  const [formData, setFormData] = useState<MarkGivenPayload>({
    batchNo: '',
    lotNo: '',
    expiryDate: undefined,
    barcodeValue: '',
    notes: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      expiryDate: value ? new Date(value) : undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) {
      onMarkGiven(task.id, formData);
      setFormData({
        batchNo: '',
        lotNo: '',
        expiryDate: undefined,
        barcodeValue: '',
        notes: '',
      });
      onClose();
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Mark Given</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Task</p>
            <p className="font-medium text-gray-900">
              {task.horseName} - {task.medName} {task.dose}{task.unit} {task.route}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="batchNo" className="block text-sm font-medium text-gray-700 mb-1">
                Batch Number
              </label>
              <input
                type="text"
                id="batchNo"
                name="batchNo"
                value={formData.batchNo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter batch number"
              />
            </div>

            <div>
              <label htmlFor="lotNo" className="block text-sm font-medium text-gray-700 mb-1">
                Lot Number
              </label>
              <input
                type="text"
                id="lotNo"
                name="lotNo"
                value={formData.lotNo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter lot number"
              />
            </div>

            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate ? formData.expiryDate.toISOString().split('T')[0] : ''}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="barcodeValue" className="block text-sm font-medium text-gray-700 mb-1">
                Barcode Value
              </label>
              <input
                type="text"
                id="barcodeValue"
                name="barcodeValue"
                value={formData.barcodeValue}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Scan or enter barcode"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Add any notes..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Mark Given
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onMarkGiven }: { task: DoseTask; onMarkGiven: (task: DoseTask) => void }) {
  const isOverdue = task.dueTime < new Date() && !task.isCompleted;
  const isDueSoon = task.dueTime <= new Date(Date.now() + 30 * 60 * 1000) && !task.isCompleted;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) {
      const overdueHours = Math.floor(-diffMs / (1000 * 60 * 60));
      const overdueMinutes = Math.floor((-diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return overdueHours > 0 ? `${overdueHours}h ${overdueMinutes}m overdue` : `${overdueMinutes}m overdue`;
    } else if (diffHours > 0) {
      return `in ${diffHours}h ${diffMinutes}m`;
    } else {
      return `in ${diffMinutes}m`;
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 p-4 transition-all duration-200 ${
      task.isCompleted 
        ? 'opacity-60 border-gray-200' 
        : isOverdue 
          ? 'border-red-200 bg-red-50' 
          : isDueSoon 
            ? 'border-yellow-200 bg-yellow-50' 
            : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.horseName}
          </h3>
          <p className={`text-sm ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-600'}`}>
            {task.medName}
          </p>
        </div>
        {task.isCompleted && task.completedAt && (
          <div className="text-right">
            <div className="text-xs text-green-600 font-medium">Completed</div>
            <div className="text-xs text-gray-500">
              {task.completedAt.toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm">
          <span className="text-gray-500 w-16">Dose:</span>
          <span className={task.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}>
            {task.dose} {task.unit}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-gray-500 w-16">Route:</span>
          <span className={task.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}>
            {task.route}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-gray-500 w-16">Due:</span>
          <span className={`${
            task.isCompleted 
              ? 'line-through text-gray-400' 
              : isOverdue 
                ? 'text-red-600 font-medium' 
                : isDueSoon 
                  ? 'text-yellow-600 font-medium' 
                  : 'text-gray-900'
          }`}>
            {formatTime(task.dueTime)}
          </span>
        </div>
      </div>

      {!task.isCompleted && (
        <button
          onClick={() => onMarkGiven(task)}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors active:scale-95 transform"
        >
          Mark Given
        </button>
      )}
    </div>
  );
}

export default function DoseTasksPage() {
  const { overdue, dueNow, dueLater, markGiven } = useDoseTasks();
  const [selectedTask, setSelectedTask] = useState<DoseTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const overdueRef = useRef<HTMLDivElement>(null);
  const dueNowRef = useRef<HTMLDivElement>(null);
  const dueLaterRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleMarkGiven = (task: DoseTask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleMarkGivenSubmit = (taskId: string, payload: MarkGivenPayload) => {
    markGiven(taskId, payload);
  };

  const sections = [
    { title: 'Overdue', count: overdue.length, ref: overdueRef, tasks: overdue, color: 'red' },
    { title: 'Due Now', count: dueNow.length, ref: dueNowRef, tasks: dueNow, color: 'yellow' },
    { title: 'Due Later', count: dueLater.length, ref: dueLaterRef, tasks: dueLater, color: 'blue' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dose Tasks</h1>
          
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {sections.map((section) => (
              <button
                key={section.title}
                onClick={() => scrollToSection(section.ref)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  section.color === 'red'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : section.color === 'yellow'
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {section.title} ({section.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {sections.map((section) => (
          <div key={section.title} ref={section.ref}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {section.title} ({section.count})
            </h2>
            
            {section.tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {section.title.toLowerCase()} tasks
              </div>
            ) : (
              <div className="space-y-3">
                {section.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMarkGiven={handleMarkGiven}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <MarkGivenModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onMarkGiven={handleMarkGivenSubmit}
      />
    </div>
  );
}