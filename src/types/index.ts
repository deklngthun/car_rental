// ============================================
// Core TypeScript Types for Vehicle Rental App
// ============================================

export interface Category {
  id: string;
  name: string;
  vat_rate: number;
  created_at: string;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  make_model: string;
  category_id: string;
  created_at?: string;
}

export interface Rental {
  id?: string;
  license_plate: string;
  license_plate_image_url?: string;
  passport_image_url?: string;
  customer_name?: string;
  hotel_name?: string;
  room_number?: string;
  category_id?: string;
  category_name?: string;
  price_per_day: number;
  num_days: number;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  receipt_url?: string;
  status?: 'active' | 'completed';
  return_km?: number;
  return_damages?: string;
  returned_at?: string;
  created_at?: string;
}

export interface ReturnFormData {
  returnKm: number;
  returnDamages: string;
}

export interface FinancialBreakdown {
  pricePerDay: number;
  numDays: number;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
}

export interface RentalFormData {
  licensePlate: string;
  licensePlateImage: File | null;
  passportImage: File | null;
  customerName: string;
  hotelName: string;
  roomNumber: string;
  categoryId: string;
  pricePerDay: number;
  numDays: number;
}

export interface DailyRevenue {
  rental_date: string;
  total_rentals: number;
  gross_revenue: number;
  total_vat: number;
  net_revenue: number;
}

export interface MonthlyRevenue {
  rental_month: string;
  total_rentals: number;
  gross_revenue: number;
  total_vat: number;
  net_revenue: number;
}

export interface CategoryRevenue {
  category: string;
  total_rentals: number;
  gross_revenue: number;
  total_vat: number;
  net_revenue: number;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  rental: Rental;
  daily_summary?: DailyRevenue;
  category_breakdown?: CategoryRevenue[];
}
