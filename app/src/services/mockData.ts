export interface Vehicle {
  plate: string;
  make: string;
  model: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Faculty' | 'Visitor';
  vehicle: Vehicle;
}

export interface ParkingLot {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  totalSpots: number;
  availableSpots: number;
  status: 'Available' | 'Busy' | 'Full';
  features: string[]; // "Near Me", "Walkability", "Late Hours", "Free Parking", "Low Cost"
  pricePerHour: number;
}

export interface Reservation {
  id: string;
  userId: string;
  lotId: string;
  spotId: string;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled';
  totalCost: number;
}

// Mock Data
export const MOCK_USER: User = {
  id: 'user_123',
  name: 'Alex Student',
  email: 'alex@university.edu',
  role: 'Student',
  vehicle: {
    plate: 'ABC-1234',
    make: 'Toyota',
    model: 'Camry',
    color: 'Silver',
  },
};

export const MOCK_LOTS: ParkingLot[] = [
  {
    id: 'lot_n06',
    name: 'Lot N06',
    location: { lat: 47.6553, lng: -122.3035 }, // Example coords (UW Seattleish)
    totalSpots: 100,
    availableSpots: 45,
    status: 'Available',
    features: ['Near Me', 'Walkability'],
    pricePerHour: 5,
  },
  {
    id: 'lot_w12',
    name: 'Lot W12',
    location: { lat: 47.6540, lng: -122.3100 },
    totalSpots: 50,
    availableSpots: 2,
    status: 'Busy',
    features: ['Late Hours', 'Low Cost'],
    pricePerHour: 3,
  },
  {
    id: 'lot_e03',
    name: 'Lot E03',
    location: { lat: 47.6580, lng: -122.3000 },
    totalSpots: 200,
    availableSpots: 0,
    status: 'Full',
    features: ['Free Parking'],
    pricePerHour: 0,
  },
];

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'res_001',
    userId: 'user_123',
    lotId: 'lot_n06',
    spotId: 'C3',
    startTime: new Date(new Date().getTime() + 1000 * 60 * 60 * 24), // Tomorrow
    endTime: new Date(new Date().getTime() + 1000 * 60 * 60 * 26),
    status: 'upcoming',
    totalCost: 10,
  },
];

// Mock Service Functions
export const MockService = {
  getUser: async (): Promise<User> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_USER), 500));
  },
  getLots: async (): Promise<ParkingLot[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_LOTS), 500));
  },
  getReservations: async (): Promise<Reservation[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_RESERVATIONS), 500));
  },
};
