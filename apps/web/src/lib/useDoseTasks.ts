import { useState, useMemo, useEffect } from 'react';

export interface DoseTask {
  id: string;
  horseName: string;
  medName: string;
  dose: number;
  unit: string;
  route: string;
  dueTime: Date;
  isCompleted: boolean;
  completedAt?: Date;
  batchNo?: string;
  lotNo?: string;
  expiryDate?: Date;
  barcodeValue?: string;
  notes?: string;
  rxItemId?: string; // For real data mode
}

export interface MarkGivenPayload {
  batchNo?: string;
  lotNo?: string;
  expiryDate?: Date;
  barcodeValue?: string;
  notes?: string;
}

export interface PrescriptionItem {
  id: string;
  medId: string;
  doseAmount: number;
  doseUnit: string;
  route: string;
  frequency: string;
  durationDays: number;
  withholdingHours?: number;
  med: {
    id: string;
    generic: string;
    brand?: string;
    form?: string;
    strength?: string;
    unit?: string;
    routes: string[];
    defaultWithholdingHours?: number;
  };
}

export interface Prescription {
  id: string;
  horseId: string;
  vetId: string;
  diagnosis?: string;
  lockedByVet: boolean;
  createdAt: string;
  items: PrescriptionItem[];
}

// Mock data - 12 tasks across 8 horses (fallback)
const mockTasks: DoseTask[] = [
  // Overdue tasks (2+)
  {
    id: '1',
    horseName: 'Desert Comet',
    medName: 'Flunixin',
    dose: 1.1,
    unit: 'ml',
    route: 'IV',
    dueTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isCompleted: false,
  },
  {
    id: '2',
    horseName: 'Thunder Strike',
    medName: 'Omeprazole',
    dose: 20,
    unit: 'mg',
    route: 'PO',
    dueTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    isCompleted: false,
  },
  // Due now tasks (3+)
  {
    id: '3',
    horseName: 'Midnight Shadow',
    medName: 'Dexamethasone',
    dose: 0.5,
    unit: 'ml',
    route: 'IM',
    dueTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    isCompleted: false,
  },
  {
    id: '4',
    horseName: 'Golden Arrow',
    medName: 'Flunixin',
    dose: 0.8,
    unit: 'ml',
    route: 'IV',
    dueTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    isCompleted: false,
  },
  {
    id: '5',
    horseName: 'Storm Chaser',
    medName: 'Omeprazole',
    dose: 15,
    unit: 'mg',
    route: 'PO',
    dueTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    isCompleted: false,
  },
  {
    id: '6',
    horseName: 'Desert Comet',
    medName: 'Dexamethasone',
    dose: 0.3,
    unit: 'ml',
    route: 'PO',
    dueTime: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes from now
    isCompleted: false,
  },
  // Due later tasks
  {
    id: '7',
    horseName: 'Silver Belle',
    medName: 'Flunixin',
    dose: 1.2,
    unit: 'ml',
    route: 'IM',
    dueTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    isCompleted: false,
  },
  {
    id: '8',
    horseName: 'Thunder Strike',
    medName: 'Dexamethasone',
    dose: 0.7,
    unit: 'ml',
    route: 'IV',
    dueTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    isCompleted: false,
  },
  {
    id: '9',
    horseName: 'Midnight Shadow',
    medName: 'Omeprazole',
    dose: 25,
    unit: 'mg',
    route: 'PO',
    dueTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    isCompleted: false,
  },
  {
    id: '10',
    horseName: 'Golden Arrow',
    medName: 'Flunixin',
    dose: 0.9,
    unit: 'ml',
    route: 'IM',
    dueTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
    isCompleted: false,
  },
  {
    id: '11',
    horseName: 'Storm Chaser',
    medName: 'Dexamethasone',
    dose: 0.4,
    unit: 'ml',
    route: 'PO',
    dueTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    isCompleted: false,
  },
  {
    id: '12',
    horseName: 'Silver Belle',
    medName: 'Omeprazole',
    dose: 18,
    unit: 'mg',
    route: 'PO',
    dueTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
    isCompleted: false,
  },
];

// Function to synthesize dose schedule from prescription items
function synthesizeDoseSchedule(prescriptions: Prescription[]): DoseTask[] {
  const tasks: DoseTask[] = [];
  const now = new Date();
  
  prescriptions.forEach(prescription => {
    prescription.items.forEach(item => {
      // Create 3 doses for today: now-2h, now, now+2h
      const times = [
        new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        new Date(now.getTime()), // now
        new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      ];
      
      times.forEach((time, index) => {
        tasks.push({
          id: `${item.id}-${index}`,
          horseName: 'Desert Comet', // We'll get this from the prescription data
          medName: item.med.generic,
          dose: item.doseAmount,
          unit: item.doseUnit,
          route: item.route,
          dueTime: time,
          isCompleted: false,
          rxItemId: item.id,
        });
      });
    });
  });
  
  return tasks;
}

export function useDoseTasks() {
  const [tasks, setTasks] = useState<DoseTask[]>(mockTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRealData, setUseRealData] = useState(true); // Toggle for real data mode

  // Fetch real prescription data
  useEffect(() => {
    if (!useRealData) return;

    const fetchPrescriptions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        
        // For now, we'll use a placeholder horse ID
        // In a real app, you'd get this from user context or route params
        // We'll need to add a horses endpoint or get this from the seed data
        const horseId = 'placeholder-horse-id';
        const response = await fetch(`${apiUrl}/horses/${horseId}/prescriptions?active=true`);
        
        if (!response.ok) {
          // If the endpoint doesn't exist or horse not found, fall back to mock data
          console.log('Prescriptions endpoint not available, using mock data');
          setTasks(mockTasks);
          return;
        }
        
        const prescriptions: Prescription[] = await response.json();
        const realTasks = synthesizeDoseSchedule(prescriptions);
        setTasks(realTasks);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch prescriptions');
        // Fall back to mock data on error
        setTasks(mockTasks);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescriptions();
  }, [useRealData]);

  const { overdue, dueNow, dueLater } = useMemo(() => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    return {
      overdue: tasks.filter(task => !task.isCompleted && task.dueTime < now),
      dueNow: tasks.filter(task => !task.isCompleted && task.dueTime >= now && task.dueTime <= oneHourFromNow),
      dueLater: tasks.filter(task => !task.isCompleted && task.dueTime > oneHourFromNow),
    };
  }, [tasks]);

  const markGiven = async (taskId: string, payload: MarkGivenPayload) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If using real data and we have an rxItemId, post to administrations endpoint
    if (useRealData && task.rxItemId) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        
        const administrationData = {
          rxItemId: task.rxItemId,
          horseId: 'placeholder-horse-id', // This should come from the task or context
          datetimeLocal: new Date().toISOString(),
          actualDose: task.dose,
          route: task.route,
          batchNo: payload.batchNo,
          lotNo: payload.lotNo,
          expiryDate: payload.expiryDate?.toISOString(),
          barcodeValue: payload.barcodeValue,
          notes: payload.notes,
        };

        const response = await fetch(`${apiUrl}/administrations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(administrationData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create administration: ${response.statusText}`);
        }

        // Update local state on success
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  isCompleted: true,
                  completedAt: new Date(),
                  batchNo: payload.batchNo,
                  lotNo: payload.lotNo,
                  expiryDate: payload.expiryDate,
                  barcodeValue: payload.barcodeValue,
                  notes: payload.notes,
                }
              : t
          )
        );
      } catch (err) {
        console.error('Error creating administration:', err);
        setError(err instanceof Error ? err.message : 'Failed to mark as given');
        throw err; // Re-throw so the UI can handle it
      }
    } else {
      // Mock data mode - just update local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                isCompleted: true,
                completedAt: new Date(),
                batchNo: payload.batchNo,
                lotNo: payload.lotNo,
                expiryDate: payload.expiryDate,
                barcodeValue: payload.barcodeValue,
                notes: payload.notes,
              }
            : t
        )
      );
    }
  };

  const toggleDataMode = () => {
    setUseRealData(!useRealData);
  };

  return {
    tasks,
    overdue,
    dueNow,
    dueLater,
    markGiven,
    isLoading,
    error,
    useRealData,
    toggleDataMode,
  };
}