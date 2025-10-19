import { useState, useMemo } from 'react';

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
}

export interface MarkGivenPayload {
  batchNo?: string;
  lotNo?: string;
  expiryDate?: Date;
  barcodeValue?: string;
  notes?: string;
}

// Mock data - 12 tasks across 8 horses
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

export function useDoseTasks() {
  const [tasks, setTasks] = useState<DoseTask[]>(mockTasks);

  const { overdue, dueNow, dueLater } = useMemo(() => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    return {
      overdue: tasks.filter(task => !task.isCompleted && task.dueTime < now),
      dueNow: tasks.filter(task => !task.isCompleted && task.dueTime >= now && task.dueTime <= oneHourFromNow),
      dueLater: tasks.filter(task => !task.isCompleted && task.dueTime > oneHourFromNow),
    };
  }, [tasks]);

  const markGiven = (taskId: string, payload: MarkGivenPayload) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              isCompleted: true,
              completedAt: new Date(),
              batchNo: payload.batchNo,
              lotNo: payload.lotNo,
              expiryDate: payload.expiryDate,
              barcodeValue: payload.barcodeValue,
              notes: payload.notes,
            }
          : task
      )
    );
  };

  return {
    tasks,
    overdue,
    dueNow,
    dueLater,
    markGiven,
  };
}