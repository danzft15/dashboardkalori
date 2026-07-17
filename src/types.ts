export interface Employee {
  nik: string;
  name: string;
  direktorat: string;
  status: 'Activated' | 'Not Activated';
  kalori: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  totalCalories: number;
  avgCalories: number;
  maxCaloriesEmployee: Employee | null;
}

export interface SheetIntegration {
  url: string;
  isConnected: boolean;
  lastFetched: string | null;
  isLoading: boolean;
  error: string | null;
}
